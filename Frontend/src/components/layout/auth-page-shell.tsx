import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthPageShellProps {
  children: ReactNode;
  /** Wider shell for split layouts (e.g. register). */
  wide?: boolean;
  className?: string;
}

/** Shared chrome for auth pages — warm gray/beige surface, larger card. */
export function AuthPageShell({
  children,
  wide = false,
  className,
}: AuthPageShellProps) {
  return (
    <main
      className={cn(
        "relative flex min-h-screen w-full flex-col items-center justify-center",
        "bg-[#F0EBE3] p-5 sm:p-8 font-sans text-stone-800",
        className
      )}
    >
      <div
        className={cn(
          "w-full overflow-hidden rounded-2xl border border-[#E0D8CC] bg-[#FFFCF8] shadow-[0_8px_30px_rgba(80,70,55,0.08)]",
          wide ? "max-w-5xl" : "max-w-lg"
        )}
      >
        {children}
      </div>

      <p className="mt-8 text-sm text-stone-500">
        © ITIS Academy Learning Management System.
      </p>
    </main>
  );
}
