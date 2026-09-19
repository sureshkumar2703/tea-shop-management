import React from "react";
import { Card } from "./Card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: "amber" | "emerald" | "blue" | "purple";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  color = "amber",
}) => {
  const colorMap = {
    amber: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    blue: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    purple: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-2xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {trend && (
          <div
            className={`flex items-center text-xs font-semibold ${
              trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="w-4 h-4 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-4 h-4 mr-0.5" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </Card>
  );
};
