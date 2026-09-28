import React, { useState } from "react";
import { Coffee, Flame } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  className?: string;
  variant?: "light" | "dark" | "color";
  logoUrl?: string;
  shopName?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showTagline = false,
  className = "",
  logoUrl: propLogoUrl,
  shopName: propShopName,
}) => {
  const { shop } = useAuthStore();
  const [imgError, setImgError] = useState(false);

  const effectiveLogoUrl = propLogoUrl || shop?.logo_url;
  const effectiveShopName = propShopName || shop?.name;

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-9 h-9",
    xl: "w-12 h-12",
  };

  const containerSizes = {
    sm: "w-9 h-9 p-1.5",
    md: "w-11 h-11 p-2",
    lg: "w-14 h-14 p-2.5",
    xl: "w-18 h-18 p-3",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg sm:text-xl",
    lg: "text-xl sm:text-2xl",
    xl: "text-2xl sm:text-3xl",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-orange-500 text-white shadow-glow overflow-hidden shrink-0 ${containerSizes[size]}`}
      >
        {effectiveLogoUrl && !imgError ? (
          <img
            src={effectiveLogoUrl}
            alt={effectiveShopName || "Shop Logo"}
            className="w-full h-full object-cover rounded-xl"
            onError={() => setImgError(true)}
          />
        ) : (
          <>
            <Coffee className={iconSizes[size]} strokeWidth={2.2} />
            <Flame className="w-3.5 h-3.5 absolute -top-1 -right-1 text-yellow-200 animate-pulse" />
          </>
        )}
      </div>
      <div>
        <div
          className={`font-bold tracking-tight font-['Outfit'] ${textSizes[size]} text-slate-900 dark:text-white flex items-center gap-1.5`}
        >
          <span>Chai</span>
          <span className="text-amber-600 dark:text-amber-400">Craft</span>
          <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ml-1">
            POS
          </span>
        </div>
        {showTagline && (
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5 font-medium truncate max-w-[140px]">
            {effectiveShopName || "Artisan Tea & Cafe"}
          </p>
        )}
      </div>
    </div>
  );
};
