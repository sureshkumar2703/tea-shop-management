import React from "react";
import { AuthCard } from "@/components/common/AuthCard";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";
import { Logo } from "@/components/common/Logo";

export const ForgotPassword: React.FC = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50/50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="mb-6">
          <Logo size="lg" showTagline />
        </div>

        <AuthCard
          title="Recover Password"
          subtitle="We'll send recovery credentials to your email"
        >
          <ForgotPasswordForm />
        </AuthCard>
      </div>
    </div>
  );
};
export default ForgotPassword;
