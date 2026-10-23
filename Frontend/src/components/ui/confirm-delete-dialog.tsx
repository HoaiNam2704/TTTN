"use client";

import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
}

const sharedButtonClass =
  "h-11 w-full rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2";

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isPending = false,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={false}
        role="alertdialog"
        overlayClassName="bg-black/40 backdrop-blur-[2px] duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        className={cn(
          "w-full gap-5 rounded-[20px] border-0 bg-white p-6 text-foreground shadow-2xl ring-1 ring-black/5",
          "sm:max-w-[480px]",
          "duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        )}
      >
        <DialogHeader className="gap-4 text-left">
          <div className="flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-500 shadow-sm ring-1 ring-stone-200/80">
            <CircleAlert className="size-6" strokeWidth={2} />
          </div>

          <div className="space-y-2">
            <DialogTitle className="font-sans text-2xl leading-tight font-bold tracking-tight text-stone-900">
              {title}
            </DialogTitle>
            <DialogDescription className="line-clamp-2 max-w-[42ch] font-sans text-[15px] leading-relaxed text-muted-foreground">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mx-0 mb-0 grid grid-cols-2 gap-3 border-0 bg-transparent p-0 sm:justify-stretch">
          <DialogClose
            disabled={isPending}
            render={
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                className={cn(
                  sharedButtonClass,
                  "border-stone-200 bg-white text-stone-600 hover:bg-stone-50 focus-visible:ring-stone-300"
                )}
              />
            }
          >
            {cancelLabel}
          </DialogClose>

          <Button
            type="button"
            disabled={isPending}
            isLoading={isPending}
            onClick={onConfirm}
            className={cn(
              sharedButtonClass,
              "border-0 bg-stone-800 text-stone-50 hover:bg-stone-700 focus-visible:ring-stone-400"
            )}
          >
            {isPending ? "Deleting..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
