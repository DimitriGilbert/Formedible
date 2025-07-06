"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface FormGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: string;
  responsive?: boolean;
  className?: string;
}

export const FormGrid: React.FC<FormGridProps> = ({
  children,
  columns = 2,
  gap = "4",
  responsive = true,
  className,
}) => {
  const gridClasses = cn(
    "grid",
    `gap-${gap}`,
    responsive ? {
      "grid-cols-1": true,
      "md:grid-cols-2": columns >= 2,
      "lg:grid-cols-3": columns >= 3,
      "xl:grid-cols-4": columns >= 4,
    } : `grid-cols-${columns}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};