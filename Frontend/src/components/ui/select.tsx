"use client";

import React, { useState, useRef } from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { ChevronDown, Check, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Select (form field) ──────────────────────────────────────────────────────

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, id, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold text-stone-600 select-none">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={id}
            ref={ref}
            className={cn(
              "w-full appearance-none rounded-md border text-sm transition-colors outline-none h-9 px-3 pr-9",
              "bg-background border-input text-foreground",
              "focus:border-ring focus:ring-1 focus:ring-ring",
              error && "border-destructive focus:border-destructive focus:ring-destructive",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

// ─── FilterSelect: Portal + FE Search + Clear ─────────────────────────────────

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectCustomProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterSelectOption[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  searchable = true,
  clearable = true,
  disabled = false,
}: FilterSelectCustomProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const hasValue = value !== "";
  const selectedLabel = options.find((o) => o.value === value)?.label;

  const filtered = search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.trim().toLowerCase())
      )
    : options;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setSearch("");
    else {
      // Focus search on open
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
  }

  return (
    <SelectPrimitive.Root
      value={hasValue ? value : null}
      onValueChange={(val) => onChange(val ?? "")}
      open={open}
      onOpenChange={handleOpenChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "inline-flex h-9 cursor-pointer items-center justify-between gap-1.5 rounded-xl border border-border bg-white py-2 pl-3 pr-2 text-sm outline-none transition-colors",
          "hover:bg-gray-50 focus-visible:border-stone-400 focus-visible:ring-2 focus-visible:ring-stone-200",
          "data-[popup-open]:border-stone-400 data-[popup-open]:bg-gray-50",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:bg-stone-100",
          hasValue ? "text-stone-800" : "text-stone-400",
          className
        )}
      >
        <span className="truncate">{selectedLabel ?? placeholder}</span>

        <span className="flex shrink-0 items-center gap-0.5">
          {/* Clear button — only when a value is selected and clearable is true */}
          {clearable && hasValue && (
            <span
              role="button"
              tabIndex={-1}
              onMouseDown={handleClear}
              className="flex h-5 w-5 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              aria-label="Clear selection"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <SelectPrimitive.Icon>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-stone-400 transition-transform duration-150",
                open && "rotate-180"
              )}
            />
          </SelectPrimitive.Icon>
        </span>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          side="bottom"
          sideOffset={4}
          align="start"
          alignItemWithTrigger={false}
          className="z-50 w-[var(--anchor-width)] min-w-[var(--anchor-width)]"
        >
          <SelectPrimitive.Popup
            className={cn(
              "w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg outline-none",
              "origin-[--transform-origin]",
              "data-[open]:animate-in data-[open]:fade-in-0 data-[open]:zoom-in-95",
              "data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95",
              "duration-100"
            )}
          >
            {/* Search input */}
            {searchable && (
              <div className="border-b border-border px-2 py-1.5">
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-stone-50 px-2 py-1">
                  <Search className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      // Prevent select's typeahead from intercepting
                      if (e.key !== "Escape" && e.key !== "Tab") {
                        e.stopPropagation();
                      }
                    }}
                    placeholder="Search..."
                    className="w-full bg-transparent text-xs text-stone-700 placeholder:text-stone-400 outline-none"
                  />
                  {search && (
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); setSearch(""); }}
                      className="text-stone-400 hover:text-stone-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options list */}
            <div className="max-h-52 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <div className="px-2.5 py-4 text-center text-xs text-stone-400">
                  No results found
                </div>
              ) : (
                options.map((opt) => (
                  <SelectPrimitive.Item
                    key={opt.value}
                    value={opt.value}
                    className={cn(
                      "relative flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-stone-700 outline-none select-none",
                      "hover:bg-stone-50 data-[highlighted]:bg-stone-50",
                      "data-[selected]:font-medium data-[selected]:text-stone-900",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                      // Hide items that don't match search (keep rendered for select to track)
                      !filtered.includes(opt) && "hidden"
                    )}
                  >
                    <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator className="ml-auto">
                      <Check className="h-3.5 w-3.5 text-stone-600" />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))
              )}
            </div>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
