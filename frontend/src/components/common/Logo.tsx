import React from "react";
import { Coffee, Flame } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  className?: string;
  variant?: "light" | "dark" | "color";
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showTagline = false,
  className = "",
}) => {
  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-9 h-9",
    xl: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center p-2 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-orange-500 text-white shadow-glow">
        <Coffee className={iconSizes[size]} strokeWidth={2.2} />
        <Flame className="w-3.5 h-3.5 absolute -top-1 -right-1 text-yellow-200 animate-pulse" />
      </div>
      <div>
        <div className={`font-bold tracking-tight font-['Outfit'] ${textSizes[size]} text-slate-900 dark:text-white flex items-center gap-1.5`}>
          <span>Chai</span>
          <span className="text-amber-600 dark:text-amber-400">Craft</span>
          <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ml-1">
            POS
          </span>
        </div>
        {showTagline && (
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5 font-medium">
            Artisan Tea & Cafe Enterprise
          </p>
        )}
      </div>
    </div>
  );
};
