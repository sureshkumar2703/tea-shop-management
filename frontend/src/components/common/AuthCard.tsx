import React from "react";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, title, subtitle }) => {
  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 shadow-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl transition-all">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
};
