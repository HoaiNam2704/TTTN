"use client";

import { useEffect, useState } from "react";
import { CircleAlert, Save } from "lucide-react";
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

interface ReorderDirtyBarProps {
  visible: boolean;
  message: string;
  isSubmitting?: boolean;
  onSubmit: () => void | Promise<void>;
  onDiscard: () => void;
  submitLabel?: string;
  confirmTitle?: string;
}

export function ReorderDirtyBar({
  visible,
  message,
  isSubmitting = false,
  onSubmit,
  onDiscard,
  submitLabel = "Save order",
  confirmTitle = "Confirm save order?",
}: ReorderDirtyBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!visible) setConfirmOpen(false);
  }, [visible]);

  const handleConfirm = async () => {
    try {
      await onSubmit();
      setConfirmOpen(false);
    } catch {
      // Keep the dialog open so the user can retry after an error toast.
    }
  };

  if (!visible) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
        <Button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isSubmitting}
          leftIcon={<Save className="h-4 w-4" />}
          className="h-9 text-xs"
        >
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onDiscard}
          disabled={isSubmitting}
          className="h-9 text-xs"
        >
          Discard reorder
        </Button>
        <p className="text-xs text-stone-500">Order has changed — not saved yet.</p>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && isSubmitting) return;
          setConfirmOpen(nextOpen);
        }}
      >
        <DialogContent
          showCloseButton={false}
          role="alertdialog"
          overlayClassName="bg-black/40 backdrop-blur-[2px]"
          className="w-full gap-5 rounded-[20px] border-0 bg-white p-6 shadow-2xl ring-1 ring-black/5 sm:max-w-[480px]"
        >
          <DialogHeader className="gap-4 text-left">
            <div className="flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-600 ring-1 ring-stone-200">
              <CircleAlert className="size-6" strokeWidth={2} />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-xl font-bold tracking-tight text-stone-900">
                {confirmTitle}
              </DialogTitle>
              <DialogDescription className="text-[15px] leading-relaxed text-stone-500">
                {message}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="mx-0 mb-0 grid grid-cols-2 gap-3 border-0 bg-transparent p-0">
            <DialogClose
              disabled={isSubmitting}
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-xl border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                />
              }
            >
              Go back
            </DialogClose>
            <Button
              type="button"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="h-11 w-full rounded-xl"
              onClick={handleConfirm}
            >
              {isSubmitting ? "Saving..." : "Confirm save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
