import React from "react";
import { Coffee } from "lucide-react";

export const PageLoader: React.FC<{ message?: string }> = ({
  message = "Brewing fresh workspace...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
        <Coffee className="w-8 h-8 animate-bounce" />
        <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
        {message}
      </p>
    </div>
  );
};
