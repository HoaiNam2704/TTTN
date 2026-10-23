"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableDragHandle } from "@/components/admin/sortable-drag-handle";
import {
  SORTABLE_DROP_ANIMATION,
  SORTABLE_TRANSITION,
  animateSortableLayoutChanges,
} from "@/components/admin/sortable-utils";
import { cn } from "@/lib/utils";

export interface AdminTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  /** Static stand-in used inside the drag overlay so interactive cells stay inert while dragging. */
  overlayCell?: (row: T, index: number) => ReactNode;
  /** Initial width in px when column resize is enabled. */
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  /** Defaults to true when `enableColumnResize` is on. */
  resizable?: boolean;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  loadingMessage?: string;
  /** Renders animated placeholder rows instead of a single loading message. */
  skeletonRows?: number;
  emptyMessage?: ReactNode;
  footer?: ReactNode;
  cardClassName?: string;
  tableClassName?: string;
  headerRowClassName?: string;
  bodyClassName?: string;
  rowClassName?: string;
  enableReorder?: boolean;
  reorderDisabled?: boolean;
  onReorder?: (activeId: string, overId: string) => void;
  reorderColumnHeader?: ReactNode;
  /** Drag the right edge of a header cell to resize that column. */
  enableColumnResize?: boolean;
}

const HEADER_CELL_CLASS =
  "h-11 px-5 text-left text-xs font-semibold tracking-wide text-stone-500";
const DEFAULT_HEADER_ROW_CLASS = "border-border bg-muted hover:bg-muted";
const DEFAULT_ROW_CLASS = "border-border hover:bg-muted/60";
const DRAG_COLUMN_WIDTH = "3rem";
const DRAG_COLUMN_CLASS = "w-12 px-3 py-3 align-middle";
const DEFAULT_COLUMN_WIDTH = 160;
const DEFAULT_MIN_COLUMN_WIDTH = 72;

function clamp(value: number, min: number, max?: number) {
  if (max !== undefined) return Math.min(Math.max(value, min), max);
  return Math.max(value, min);
}

function ColumnResizeHandle({
  onDelta,
}: {
  onDelta: (deltaX: number) => void;
}) {
  const lastXRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const handle = event.currentTarget;
    lastXRef.current = event.clientX;
    setIsDragging(true);
    handle.setPointerCapture(event.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - lastXRef.current;
      lastXRef.current = moveEvent.clientX;
      if (delta !== 0) onDelta(delta);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      setIsDragging(false);
      handle.releasePointerCapture(upEvent.pointerId);
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);
      handle.removeEventListener("pointercancel", onPointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", onPointerUp);
    handle.addEventListener("pointercancel", onPointerUp);
  };

  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label="Drag to resize column"
      title="Drag to resize column"
      onPointerDown={handlePointerDown}
      className={cn(
        "group/resize absolute inset-y-0 -right-2 z-30 flex w-4 cursor-col-resize touch-none items-center justify-center",
        isDragging && "bg-primary/5"
      )}
    >
      <span
        className={cn(
          "h-5 w-0.5 rounded-full bg-stone-300 transition-colors",
          "group-hover/resize:h-7 group-hover/resize:bg-stone-500",
          isDragging && "h-7 bg-primary"
        )}
      />
    </span>
  );
}

function SortableAdminRow({
  id,
  disabled,
  className,
  children,
}: {
  id: string;
  disabled: boolean;
  className?: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id,
      disabled,
      animateLayoutChanges: animateSortableLayoutChanges,
      transition: SORTABLE_TRANSITION,
    });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
    zIndex: isDragging ? 0 : undefined,
    position: "relative",
    willChange: isDragging || transform ? "transform" : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(className, isDragging && "bg-stone-50 shadow-none")}
    >
      <TableCell
        className={DRAG_COLUMN_CLASS}
        style={{ width: DRAG_COLUMN_WIDTH, minWidth: DRAG_COLUMN_WIDTH }}
      >
        <SortableDragHandle disabled={disabled} {...attributes} {...listeners} />
      </TableCell>
      {children}
    </TableRow>
  );
}

export function AdminTable<T>({
  columns,
  data,
  getRowId,
  isLoading = false,
  loadingMessage = "Loading data...",
  skeletonRows,
  emptyMessage = "No data yet.",
  footer,
  cardClassName,
  tableClassName,
  headerRowClassName,
  bodyClassName,
  rowClassName,
  enableReorder = false,
  reorderDisabled = false,
  onReorder,
  reorderColumnHeader = "#",
  enableColumnResize = false,
}: AdminTableProps<T>) {
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const initialWidths = useMemo(() => {
    const next: Record<string, number> = {};
    for (const column of columns) {
      if (column.width !== undefined) next[column.key] = column.width;
    }
    return next;
  }, [columns]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(initialWidths);
  const widthsSignature = useMemo(
    () =>
      columns
        .map((column) => `${column.key}:${column.width ?? ""}:${column.minWidth ?? ""}`)
        .join("|"),
    [columns]
  );
  const prevWidthsSignature = useRef(widthsSignature);

  useEffect(() => {
    if (prevWidthsSignature.current === widthsSignature) return;
    prevWidthsSignature.current = widthsSignature;
    setColumnWidths((prev) => {
      const next: Record<string, number> = {};
      for (const column of columns) {
        if (column.width === undefined) continue;
        next[column.key] = prev[column.key] ?? column.width;
      }
      return next;
    });
  }, [columns, widthsSignature]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const dragDisabled = reorderDisabled || data.length < 2;
  const columnCount = columns.length + (enableReorder ? 1 : 0);
  const useFixedLayout = enableReorder || enableColumnResize;

  const activeRowIndex = data.findIndex((row) => getRowId(row) === activeRowId);
  const activeRow = activeRowIndex >= 0 ? data[activeRowIndex] : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveRowId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveRowId(null);
    if (!over || active.id === over.id || dragDisabled) return;
    onReorder?.(String(active.id), String(over.id));
  };

  const getColumnWidthStyle = useCallback(
    (column: AdminTableColumn<T>): CSSProperties | undefined => {
      const width = columnWidths[column.key] ?? column.width;
      if (width === undefined) return undefined;
      const minWidth = column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
      return {
        width,
        minWidth,
        maxWidth: column.maxWidth,
      };
    },
    [columnWidths]
  );

  const resizeColumn = useCallback(
    (columnKey: string, deltaX: number) => {
      setColumnWidths((prev) => {
        const column = columns.find((item) => item.key === columnKey);
        if (!column) return prev;
        const current = prev[columnKey] ?? column.width ?? DEFAULT_COLUMN_WIDTH;
        const nextWidth = clamp(
          current + deltaX,
          column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
          column.maxWidth
        );
        if (nextWidth === current) return prev;
        return { ...prev, [columnKey]: nextWidth };
      });
    },
    [columns]
  );

  const headerCells = (
    <TableRow className={cn(DEFAULT_HEADER_ROW_CLASS, headerRowClassName)}>
      {enableReorder && (
        <TableHead
          className={cn(HEADER_CELL_CLASS, "w-12 px-3 text-center")}
          style={{ width: DRAG_COLUMN_WIDTH, minWidth: DRAG_COLUMN_WIDTH }}
        >
          {reorderColumnHeader}
        </TableHead>
      )}
      {columns.map((column, index) => {
        const canResize =
          enableColumnResize &&
          column.resizable !== false &&
          index < columns.length - 1;
        const widthStyle = getColumnWidthStyle(column);

        return (
          <TableHead
            key={column.key}
            className={cn(
              HEADER_CELL_CLASS,
              "relative overflow-visible",
              column.headerClassName
            )}
            style={widthStyle}
          >
            <span className="block truncate pr-2">{column.header}</span>
            {canResize && (
              <ColumnResizeHandle onDelta={(delta) => resizeColumn(column.key, delta)} />
            )}
          </TableHead>
        );
      })}
    </TableRow>
  );

  const messageRow = (content: ReactNode) => (
    <TableRow>
      <TableCell
        colSpan={columnCount}
        className="px-5 py-10 text-center text-stone-500"
      >
        {content}
      </TableCell>
    </TableRow>
  );

  const dataCells = (row: T, index: number) =>
    columns.map((column) => (
      <TableCell
        key={column.key}
        className={cn("px-5 py-3 align-middle", column.cellClassName)}
        style={getColumnWidthStyle(column)}
      >
        {column.cell(row, index)}
      </TableCell>
    ));

  let body: ReactNode;

  if (isLoading) {
    body = skeletonRows
      ? Array.from({ length: skeletonRows }, (_, index) => (
          <TableRow key={`skeleton-${index}`} className={rowClassName}>
            <TableCell colSpan={columnCount} className="px-5 py-5">
              <div className="h-4 animate-pulse rounded bg-stone-100" />
            </TableCell>
          </TableRow>
        ))
      : messageRow(loadingMessage);
  } else if (data.length === 0) {
    body = messageRow(emptyMessage);
  } else if (enableReorder) {
    body = (
      <SortableContext
        items={data.map((row) => getRowId(row))}
        strategy={verticalListSortingStrategy}
      >
        {data.map((row, index) => (
          <SortableAdminRow
            key={getRowId(row)}
            id={getRowId(row)}
            disabled={dragDisabled}
            className={cn(DEFAULT_ROW_CLASS, rowClassName)}
          >
            {dataCells(row, index)}
          </SortableAdminRow>
        ))}
      </SortableContext>
    );
  } else {
    body = data.map((row, index) => (
      <TableRow key={getRowId(row)} className={cn(DEFAULT_ROW_CLASS, rowClassName)}>
        {dataCells(row, index)}
      </TableRow>
    ));
  }

  const table = (
    <Table
      className={cn(
        useFixedLayout && "w-full min-w-0 table-fixed",
        tableClassName
      )}
    >
      <TableHeader
        className={cn(
          enableReorder &&
            "table w-full min-w-0 table-fixed [&_tr]:table [&_tr]:w-full [&_tr]:min-w-0 [&_tr]:table-fixed"
        )}
      >
        {headerCells}
      </TableHeader>
      <TableBody
        className={cn(
          enableReorder &&
            "block w-full min-w-0 [&_tr]:table [&_tr]:w-full [&_tr]:min-w-0 [&_tr]:table-fixed",
          bodyClassName
        )}
      >
        {body}
      </TableBody>
    </Table>
  );

  return (
    <Card padding="none" className={cn("overflow-hidden", cardClassName)}>
      {enableReorder ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveRowId(null)}
          autoScroll={false}
        >
          {table}

          <DragOverlay dropAnimation={SORTABLE_DROP_ANIMATION}>
            {activeRow ? (
              <table className="w-full min-w-0 table-fixed border-collapse text-sm">
                <tbody>
                  <tr className="rounded-xl border border-stone-200 bg-white shadow-lg ring-1 ring-black/5">
                    <td
                      className={DRAG_COLUMN_CLASS}
                      style={{ width: DRAG_COLUMN_WIDTH, minWidth: DRAG_COLUMN_WIDTH }}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center text-stone-400">
                        <GripVertical className="h-4 w-4" />
                      </span>
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn("px-5 py-3 align-middle", column.cellClassName)}
                        style={getColumnWidthStyle(column)}
                      >
                        {(column.overlayCell ?? column.cell)(activeRow, activeRowIndex)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        table
      )}

      {footer}
    </Card>
  );
}
