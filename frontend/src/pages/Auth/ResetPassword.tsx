import React from "react";
import { AuthCard } from "@/components/common/AuthCard";
import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";
import { Logo } from "@/components/common/Logo";

export const ResetPassword: React.FC = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50/50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="mb-6">
          <Logo size="lg" showTagline />
        </div>

        <AuthCard
          title="Create New Password"
          subtitle="Set a secure password for your staff account"
        >
          <ResetPasswordForm />
        </AuthCard>
      </div>
    </div>
  );
};
export default ResetPassword;
