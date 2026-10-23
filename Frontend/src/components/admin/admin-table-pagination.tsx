"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminTablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  summary?: ReactNode;
  className?: string;
}

export function AdminTablePagination({
  page,
  totalPages,
  onPageChange,
  summary,
  className,
}: AdminTablePaginationProps) {
  const lastPage = Math.max(totalPages, 1) - 1;
  const currentPage = Math.min(Math.max(page, 0), lastPage);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <span className="text-xs text-stone-500">{summary}</span>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          className="h-8 px-2"
          aria-label="Previous page"
          disabled={currentPage === 0}
          onClick={() => onPageChange(Math.max(currentPage - 1, 0))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {Array.from({ length: Math.max(totalPages, 1) }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onPageChange(index)}
            className={cn(
              "h-8 w-8 rounded-lg text-xs font-medium transition-colors",
              index === currentPage
                ? "bg-[#D4C4A8] text-stone-900"
                : "text-stone-500 hover:bg-[#E8DFD0]/60"
            )}
          >
            {index + 1}
          </button>
        ))}

        <Button
          variant="outline"
          className="h-8 px-2"
          aria-label="Next page"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(Math.min(currentPage + 1, lastPage))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
