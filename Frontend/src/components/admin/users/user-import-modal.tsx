"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Upload, X } from "lucide-react";
import { AdminModal } from "@/components/admin/quiz/admin-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { userService } from "@/services/user.service";
import type { ApiError } from "@/services/api";

function getErrorMessage(error: unknown) {
  return (error as ApiError)?.message || "Unable to import CSV.";
}

interface UserImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function UserImportModal({ open, onClose }: UserImportModalProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const importMutation = useMutation({
    mutationFn: (file: File) => userService.importUsersFromCSV(file),
    onSuccess: async (response) => {
      addToast({
        type: "success",
        message: response.message || "Users imported from CSV.",
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users-classes"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users-majors"] });
    },
    onError: (mutationError) => {
      addToast({ type: "error", message: getErrorMessage(mutationError) });
    },
  });

  const resetState = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleImport = () => {
    if (!selectedFile) {
      addToast({ type: "error", message: "Please select a CSV file first." });
      return;
    }

    importMutation.mutate(selectedFile);
  };

  return (
    <AdminModal
      open={open}
      onClose={handleClose}
      title="Bulk import users"
      description="Select a CSV file to add users to the system."
      className="max-w-xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={handleImport}
            disabled={!selectedFile || importMutation.isPending}
          >
            {importMutation.isPending ? "Importing..." : "Import users"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border-2 border-dashed border-border bg-muted p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-stone-400">
            <FileText className="h-8 w-8" />
          </div>
          <p className="text-sm font-medium text-stone-700">Drag and drop a CSV file here</p>
          <p className="mt-1 text-xs text-stone-400">or click the button below to choose a file</p>
        </div>

        <div className="rounded-xl border border-border bg-white px-4 py-3 text-left text-xs text-stone-600">
          <p className="font-semibold text-stone-700">Expected CSV columns</p>
          <p className="mt-1 leading-5">
            Full Name, Date of Birth, Class, Phone, Student ID, Email
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button leftIcon={<Upload className="h-4 w-4" />} onClick={handleBrowse}>
            Choose CSV file
          </Button>
          {selectedFile ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              <X className="h-4 w-4" />
              {selectedFile.name}
            </button>
          ) : null}
        </div>

        {selectedFile ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Selected file: <span className="font-semibold">{selectedFile.name}</span>
          </div>
        ) : null}
      </div>
    </AdminModal>
  );
}
