import React from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface LogoProps {
  showIcon?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo: React.FC<LogoProps> = ({
  showIcon = true,
  className = "",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <Link
      href={ROUTES.DASHBOARD}
      className={`inline-flex items-center gap-2 select-none group focus:outline-none ${className}`}
    >
      {showIcon && (
        <svg
          className={`${iconSizes[size]} text-primary transition-transform duration-200 group-hover:scale-105`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          {/* Reusable Book Icon representing "ITIS Academy" */}
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 4.5c-1.35-1.55-3.35-2.5-5.5-2.5S2.35 2.95 1 4.5v15c1.35-1.55 3.35-2.5 5.5-2.5s4.15.95 5.5 2.5c1.35-1.55 3.35-2.5 5.5-2.5s4.15.95 5.5 2.5v-15c-1.35-1.55-3.35-2.5-5.5-2.5s-4.15.95-5.5 2.5zM2 5.5V17c1.5-.5 3.5-.5 5 0V5.5c-1.5-.5-3.5-.5-5 0zm15 0V17c1.5-.5 3.5-.5 5 0V5.5c-1.5-.5-3.5-.5-5 0zm-8 4H4v1.5h5V9.5zm-5 4h5v-1.5H4v1.5zm16-4h-5v1.5h5V9.5zm-5 4h5v-1.5h-5v1.5z"
            fill="currentColor"
          />
        </svg>
      )}
      <span
        className={`font-bold tracking-tight text-primary ${sizeClasses[size]}`}
      >
        ITIS Academy
      </span>
    </Link>
  );
};
