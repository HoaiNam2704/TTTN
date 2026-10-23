"use client";

import React, { useRef, useState, useCallback } from "react";
import { ImageIcon, UploadCloud, X } from "lucide-react";

export interface ImageUploadProps {
  /** Label shown above the upload area */
  label?: string;
  /** Newly selected file (controlled) */
  value?: File | null;
  /** Existing image URL from the server (used when editing) */
  existingUrl?: string;
  /** Callback when the user selects or removes an image */
  onChange?: (file: File | null) => void;
  /** Hint for formats or size limits */
  helperText?: string;
  /** Error state */
  error?: string;
  /** Allowed MIME types, defaults to image/* */
  accept?: string;
  /** Maximum size in bytes (default 5 MB) */
  maxSizeBytes?: number;
  className?: string;
}

export function ImageUpload({
  label = "Thumbnail",
  value,
  existingUrl,
  onChange,
  helperText = "PNG, JPG, WEBP · Max 5 MB",
  error,
  accept = "image/*",
  maxSizeBytes = 5 * 1024 * 1024,
  className = "",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  // Track whether the user has removed the existingUrl
  const [existingRemoved, setExistingRemoved] = useState(false);

  // Prefer newly selected file > existingUrl (if not removed)
  const newPreviewUrl = value ? URL.createObjectURL(value) : null;
  const showExisting = !existingRemoved && !value && !!existingUrl;
  const activePreviewUrl = newPreviewUrl ?? (showExisting ? existingUrl : null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      setSizeError(null);
      if (!file) return;
      if (file.size > maxSizeBytes) {
        setSizeError(
          `Image is too large. Max ${Math.round(maxSizeBytes / 1024 / 1024)} MB.`
        );
        return;
      }
      setExistingRemoved(false);
      onChange?.(file);
    },
    [maxSizeBytes, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleRemove = () => {
    setSizeError(null);
    onChange?.(null);
    setExistingRemoved(true);
  };

  const displayError = error || sizeError;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-xs font-semibold text-gray-700 select-none">
          {label}
        </span>
      )}

      {activePreviewUrl ? (
        /* ── Preview state ── */
        <div
          className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group cursor-pointer"
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activePreviewUrl}
            alt="Thumbnail preview"
            className="w-full object-cover aspect-video"
          />

          {/* Hover overlay – click to change image */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <span className="flex items-center gap-1.5 bg-white text-gray-800 text-xs font-semibold px-3 py-2 rounded-lg shadow">
              <UploadCloud className="h-4 w-4" />
              Change image
            </span>
          </div>

          {/* Remove button always visible in the top-right corner */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleRemove(); }}
            className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 hover:text-red-500 text-gray-600 rounded-full p-1.5 shadow-md transition z-10"
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        /* ── Drop zone state ── */
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            w-full flex flex-col items-center justify-center gap-3
            rounded-xl border-2 border-dashed cursor-pointer
            py-8 px-4 transition-all duration-200 select-none
            ${isDragging
              ? "border-primary bg-accent scale-[1.01]"
              : displayError
              ? "border-destructive bg-destructive/5 hover:border-destructive"
              : "border-input bg-muted hover:border-primary hover:bg-accent"
            }
          `}
        >
          <div
            className={`
              flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200
              ${isDragging ? "bg-secondary" : "bg-background"}
            `}
          >
            {isDragging ? (
              <UploadCloud className="h-6 w-6 text-primary" />
            ) : (
              <ImageIcon className="h-6 w-6 text-gray-500" />
            )}
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? (
                "Drop image here"
              ) : (
                <>
                  <span className="text-primary font-semibold">Choose image</span>
                  {" or drag and drop here"}
                </>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{helperText}</p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
      />

      {displayError && (
        <p className="text-xs text-red-600 mt-0.5">{displayError}</p>
      )}
    </div>
  );
}
