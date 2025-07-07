import React from "react";
import { motion } from "motion/react";

export const CustomProgress: React.FC<{
  value: number;
  currentPage: number;
  totalPages: number;
  className?: string;
}> = ({ value, currentPage, totalPages, className }) => (
  <div className={`space-y-4 ${className}`}>
    <div className="flex justify-between items-center">
      <h3 className="text-sm font-medium text-muted-foreground">
        Registration Progress
      </h3>
      <span className="text-sm font-bold text-primary">
        {Math.round(value)}% Complete
      </span>
    </div>
    <div className="relative">
      <div className="flex justify-between mb-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-colors ${
              i + 1 < currentPage
                ? "bg-primary border-primary text-primary-foreground"
                : i + 1 === currentPage
                ? "bg-primary/20 border-primary text-primary"
                : "bg-muted border-muted-foreground/20 text-muted-foreground"
            }`}
          >
            {i + 1 < currentPage ? "✓" : i + 1}
          </div>
        ))}
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <motion.div
          className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  </div>
);