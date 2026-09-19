import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } catch (e) {
      console.warn("Reset password trigger", e);
    }
    setIsLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Reset Link Sent!
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          We've dispatched password reset instructions to{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>.
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
        Enter your work email address and we'll send a secure password reset link.
      </p>

      <Input
        label="Email Address"
        type="email"
        icon={<Mail className="w-4 h-4" />}
        placeholder="name@chaicraft.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        size="lg"
        isLoading={isLoading}
      >
        Send Recovery Email
      </Button>

      <div className="text-center pt-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    </form>
  );
};
