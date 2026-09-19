import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const ResetPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (resetErr) {
        setError(resetErr.message);
      } else {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (e: any) {
      setError(e.message || "Failed to update password.");
    }
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="text-center space-y-4 py-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Password Updated!
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your credentials have been updated securely. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          {error}
        </div>
      )}

      <Input
        label="New Password"
        type="password"
        icon={<Lock className="w-4 h-4" />}
        placeholder="••••••••"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />

      <Input
        label="Confirm Password"
        type="password"
        icon={<Lock className="w-4 h-4" />}
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        size="lg"
        isLoading={isLoading}
      >
        Update Password
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
