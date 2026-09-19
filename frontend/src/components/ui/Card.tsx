import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glass = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200",
        glass
          ? "glass-panel shadow-sm"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
