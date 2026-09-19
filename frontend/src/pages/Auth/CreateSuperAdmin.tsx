import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  KeyRound,
} from "lucide-react";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  secretKey: string;
}

// A simple guard key to prevent anyone from accidentally creating a superadmin.
// Change this to something secure in production / use an env variable.
const SETUP_SECRET = import.meta.env.VITE_SETUP_SECRET_KEY || "CHAI_SETUP_2026";

export const CreateSuperAdmin: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    secretKey: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError("");
  };

  const validate = (): string | null => {
    if (!form.secretKey.trim()) return "Please enter the setup secret key.";
    if (form.secretKey.trim() !== SETUP_SECRET)
      return "Invalid setup secret key. Contact your system administrator.";
    if (!form.fullName.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Please enter a valid email address.";
    if (form.password.length < 8)
      return "Password must be at least 8 characters long.";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Create the user in Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            name: form.fullName.trim(),
            role: "SUPER_ADMIN",
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError("User creation failed. No user returned from Supabase Auth.");
        setIsLoading(false);
        return;
      }

      // Step 2: Insert row into the `users` table
      const { error: profileError } = await supabase.from("users").insert([
        {
          shop_id: null,                               // SuperAdmin has no shop
          name: form.fullName.trim(),                  // DB column: name
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          role: "SUPER_ADMIN",
          salary: 0,                                   // DB column: salary
          is_active: true,
        },
      ]);

      if (profileError) {
        // Rollback: delete the auth user if profile insert failed
        await supabase.auth.admin?.deleteUser(authData.user.id).catch(() => {});
        setError(
          `User table insert failed: ${profileError.message}.`
        );
        setIsLoading(false);
        return;
      }

      // Success!
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-green-50/40 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold font-['Outfit'] text-slate-900 dark:text-white">
              Super Admin Created!
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Account for <span className="font-semibold text-slate-700 dark:text-slate-300">{form.fullName}</span> has been set up successfully.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-left space-y-2 text-xs">
            <p className="font-bold text-amber-800 dark:text-amber-300">Login credentials:</p>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{form.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Password:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{"•".repeat(form.password.length)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Role:</span>
              <span className="font-bold text-purple-600">SUPER_ADMIN</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {supabase.auth ? "Check your email inbox to verify your address if email confirmation is enabled in Supabase." : ""}
          </p>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all shadow-md shadow-amber-500/30"
          >
            Go to Login Page
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-slate-50/50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold font-['Outfit'] text-slate-900 dark:text-white">
              Create Super Admin
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              First-time platform setup · Creates a Supabase Auth account + profile
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5">

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Setup Secret Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                Setup Secret Key <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                id="setup-secret"
                placeholder="Enter setup secret key"
                value={form.secretKey}
                onChange={set("secretKey")}
                autoComplete="off"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-amber-50/40 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
              />
              <p className="text-[11px] text-slate-400">
                Defined in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">VITE_SETUP_SECRET_KEY</code> env variable (default: <code className="text-amber-600">CHAI_SETUP_2026</code>)
              </p>
            </div>

            <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="sa-name" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-500" />
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="sa-name"
                  type="text"
                  placeholder="e.g. Vikram Singh"
                  value={form.fullName}
                  onChange={set("fullName")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="sa-email" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-500" />
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="sa-email"
                  type="email"
                  placeholder="superadmin@yourcompany.com"
                  value={form.email}
                  onChange={set("email")}
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="sa-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-purple-500" />
                  Phone Number <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  id="sa-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={set("phone")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="sa-password" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-500" />
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="sa-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={set("password")}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="sa-confirm" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-500" />
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="sa-confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    autoComplete="new-password"
                    className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition bg-white dark:bg-slate-800 ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? "border-rose-400 focus:ring-rose-400"
                        : "border-slate-200 dark:border-slate-700 focus:ring-purple-400"
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-rose-500">Passwords do not match.</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/30 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating SuperAdmin…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Create Super Admin Account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-amber-600 hover:text-amber-700 font-semibold">
              Sign in instead
            </Link>
          </p>
        </div>

        {/* Info note */}
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1.5 backdrop-blur-sm">
          <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
            What this page does:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Creates a user in <strong>Supabase Authentication</strong> with email & password</li>
            <li>Inserts a row in the <strong>profiles</strong> table with <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-purple-600">role = SUPER_ADMIN</code></li>
            <li>Redirects you to login to sign in with the new credentials</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default CreateSuperAdmin;
