import React from "react";
import { AuthCard } from "@/components/common/AuthCard";
import { LoginForm } from "@/components/forms/LoginForm";
import { Logo } from "@/components/common/Logo";

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50/50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-orange-400/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="mb-6">
          <Logo size="lg" showTagline />
        </div>

        <AuthCard
          title="Sign in to ChaiCraft"
          subtitle="Enterprise POS, Multi-Tenancy & Chai Shop Operations"
        >
          <LoginForm />
        </AuthCard>

        <p className="mt-8 text-xs text-slate-500 text-center font-medium">
          Protected by Supabase Row-Level-Security & PostgreSQL &copy; 2026 ChaiCraft
        </p>
      </div>
    </div>
  );
};
export default Login;
