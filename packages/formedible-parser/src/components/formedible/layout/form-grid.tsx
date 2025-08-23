"use client";
import React from "react";
import { cn } from "@/lib/utils";
import type { FormGridProps } from "@/lib/formedible/types";

export interface GridItemProps {
  gridColumn?: number;
  gridRow?: number;
  gridColumnSpan?: number;
  gridRowSpan?: number;
  gridArea?: string;
  children: React.ReactNode;
}

export const GridItem: React.FC<GridItemProps> = ({
  gridColumn,
  gridRow,
  gridColumnSpan,
  gridRowSpan,
  gridArea,
  children,
}) => {
  const gridStyles: React.CSSProperties = {};
  
  if (gridArea) {
    gridStyles.gridArea = gridArea;
  } else {
    if (gridColumn) {
      if (gridColumnSpan) {
        gridStyles.gridColumn = `${gridColumn} / span ${gridColumnSpan}`;
      } else {
        gridStyles.gridColumnStart = gridColumn;
      }
    }
    if (gridRow) {
      if (gridRowSpan) {
        gridStyles.gridRow = `${gridRow} / span ${gridRowSpan}`;
      } else {
        gridStyles.gridRowStart = gridRow;
      }
    }
    if (gridColumnSpan && !gridColumn) {
      gridStyles.gridColumn = `span ${gridColumnSpan}`;
    }
    if (gridRowSpan && !gridRow) {
      gridStyles.gridRow = `span ${gridRowSpan}`;
    }
  }

  return (
    <div style={gridStyles}>
      {children}
    </div>
  );
};

export const FormGrid: React.FC<FormGridProps> = ({
  children,
  columns = 2,
  gap = "4",
  responsive = false,
  className,
}) => {
  // Filter out null, undefined, and false children to prevent empty grid cells
  const validChildren = React.Children.toArray(children).filter(
    // @ts-expect-error raf de ta mr2
    (child) => child !== null && child !== undefined && child !== false
  );
  // If no valid children, render nothing
  if (validChildren.length === 0) {
    return null;
  }

  // Use the requested columns, capped at 12 for sanity
  const actualColumns = Math.min(columns, 12);
  const gapClasses = {
    "0": "gap-0",
    "1": "gap-1",
    "2": "gap-2",
    "3": "gap-3",
    "4": "gap-4",
    "5": "gap-5",
    "6": "gap-6",
    "7": "gap-7",
    "8": "gap-8",
    "9": "gap-9",
    "10": "gap-10",
    "11": "gap-11",
    "12": "gap-12",
    "sm": "gap-2",
    "md": "gap-4",
    "lg": "gap-6",
    "xl": "gap-8",
  };

  const gridColsClasses = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
    9: "grid-cols-9",
    10: "grid-cols-10",
    11: "grid-cols-11",
    12: "grid-cols-12",
  };

  const gridClasses = cn(
    "grid",
    gapClasses[gap as keyof typeof gapClasses],
    responsive
      ? {
          "grid-cols-1": actualColumns >= 2, // Start with 1 column on small screens when we have 2+ columns
          "sm:grid-cols-2": actualColumns >= 2,
          "md:grid-cols-3": actualColumns >= 3,
          "lg:grid-cols-4": actualColumns >= 4 && columns >= 4,
        }
      : gridColsClasses[actualColumns as keyof typeof gridColsClasses],
    className
  );

  return <div className={gridClasses}>{validChildren}</div>;
};
