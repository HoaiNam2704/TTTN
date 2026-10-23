"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollableSectionListProps {
  children: ReactNode;
  /** Number of collapsed section rows visible before scrolling. */
  maxVisible?: number;
  /** Approximate height of one collapsed section row. */
  itemHeightRem?: number;
  className?: string;
  viewportClassName?: string;
}

/**
 * Outer shell that clamps the visible list to ~maxVisible items
 * and lets the user scroll the rest inside the panel.
 */
export function ScrollableSectionList({
  children,
  maxVisible = 5,
  itemHeightRem = 4.75,
  className,
  viewportClassName,
}: ScrollableSectionListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setCanScrollUp(scrollTop > 4);
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 4);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    if (el.firstElementChild) resizeObserver.observe(el.firstElementChild);

    return () => {
      el.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, [children, maxVisible, itemHeightRem]);

  return (
    <div className={cn("relative", className)}>
      {canScrollUp && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 rounded-t-[inherit] bg-gradient-to-b from-white to-transparent"
        />
      )}

      <div
        ref={viewportRef}
        className={cn(
          "overflow-y-auto overscroll-contain scroll-smooth",
          "[scrollbar-gutter:stable]",
          viewportClassName
        )}
        style={{ maxHeight: `calc(${maxVisible} * ${itemHeightRem}rem)` }}
      >
        {children}
      </div>

      {canScrollDown && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 rounded-b-[inherit] bg-gradient-to-t from-white via-white/90 to-transparent"
        />
      )}
    </div>
  );
}
