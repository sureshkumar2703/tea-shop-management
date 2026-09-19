import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { getDefaultDashboard } from "@/lib/permissions";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  LogIn,
} from "lucide-react";

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithSupabase, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    const res = await loginWithSupabase(email.trim(), password);
    if (res.error) {
      setError(res.error);
    } else {
      // Read the fresh role from store after login
      const state = useAuthStore.getState();
      if (state.role) {
        navigate(getDefaultDashboard(state.role));
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field */}
        <Input
          label="Email Address"
          type="email"
          id="login-email"
          icon={<Mail className="w-4 h-4" />}
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          autoComplete="email"
          autoFocus
        />

        {/* Password Field */}
        <div className="space-y-1">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            id="login-password"
            icon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none"
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                )}
              </button>
            }
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            autoComplete="current-password"
          />
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          size="lg"
          isLoading={isLoading}
          icon={!isLoading ? <LogIn className="w-4 h-4" /> : undefined}
        >
          {isLoading ? "Signing in…" : "Sign In to Portal"}
        </Button>
      </form>

      {/* Security Note */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Login is verified against Supabase Authentication and your user profile role.
          Access is granted based on your assigned role (Superadmin, Admin, or Employee).
        </p>
      </div>
    </div>
  );
};
