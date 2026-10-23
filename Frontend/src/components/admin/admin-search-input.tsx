"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  id,
  className,
}: AdminSearchInputProps) {
  return (
    <div className={cn("min-w-[220px] flex-1 basis-[220px] sm:max-w-sm", className)}>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        leftIcon={<Search className="h-4 w-4" />}
        className="h-9 rounded-lg border-border"
      />
    </div>
  );
}
