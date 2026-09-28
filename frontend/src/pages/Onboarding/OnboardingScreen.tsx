import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { getDefaultDashboard } from "@/lib/permissions";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Coffee,
  Receipt,
  Wallet,
  TrendingUp,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Store,
  Layers,
  FileSpreadsheet,
  Clock,
  QrCode,
  Banknote,
} from "lucide-react";

export const OnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, shop } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = [
    {
      stepNumber: 1,
      badge: "High-Speed Counter POS",
      title: "Smart Tea & Beverage Counter Billing",
      subtitle:
        "Engineered specifically for artisan chai shops and quick-service cafes with lightning-fast order processing.",
      icon: <Coffee className="w-10 h-10 text-amber-500" />,
      themeColor: "from-amber-500/20 via-orange-500/10 to-transparent",
      borderColor: "border-amber-500/30",
      features: [
        {
          icon: <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          title: "Multi-Variant Drink Support",
          desc: "Switch effortlessly between Regular and Thirsty sizes with dynamic pricing.",
        },
        {
          icon: <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
          title: "Cash & Instant UPI / QR Payments",
          desc: "Accept split payments, direct UPI QR scans, and counter cash seamlessly.",
        },
        {
          icon: <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          title: "Thermal Receipt Printing",
          desc: "Generate professional 58mm/80mm thermal receipts with shop branding.",
        },
      ],
    },
    {
      stepNumber: 2,
      badge: "Daily Operations & Spend",
      title: "Real-Time Expenses & Cash Register (Datepay)",
      subtitle:
        "Take control of operational spending, dairy/supplies procurement, and end-of-shift cash drawer balance.",
      icon: <Wallet className="w-10 h-10 text-emerald-500" />,
      themeColor: "from-emerald-500/20 via-teal-500/10 to-transparent",
      borderColor: "border-emerald-500/30",
      features: [
        {
          icon: <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          title: "Expense Recording & Settlement",
          desc: "Staff can record daily milk, snack, and grocery expenses with bill verification.",
        },
        {
          icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          title: "Daily Register & Datepay Closeout",
          desc: "Audit morning floating investment, total billing cash, and closing cash balance.",
        },
        {
          icon: <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
          title: "Stock & Inventory Tracking",
          desc: "Automated ingredient deduction and low-stock alerts before items run out.",
        },
      ],
    },
    {
      stepNumber: 3,
      badge: "Reports & Platform Control",
      title: "Enterprise Analytics & Staff Payroll",
      subtitle:
        "Comprehensive calendar reports, multi-franchise audit tools, and automated employee compensation.",
      icon: <TrendingUp className="w-10 h-10 text-blue-500" />,
      themeColor: "from-blue-500/20 via-indigo-500/10 to-transparent",
      borderColor: "border-blue-500/30",
      features: [
        {
          icon: <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
          title: "Calendar Sales & Expense Reports",
          desc: "Day, Week (Mon-Sun), Month, Year, and Custom range reporting with PDF/CSV export.",
        },
        {
          icon: <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
          title: "Staff Performance & Salary Ledger",
          desc: "Track individual barista sales, attendance logs, and monthly salary statements.",
        },
        {
          icon: <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          title: "Role-Based Security & Permissions",
          desc: "Fine-grained access control for Super Admins, Store Owners, and Baristas.",
        },
      ],
    },
  ];

  const handleFinish = () => {
    // Save onboarding status in localStorage
    localStorage.setItem("chaicraft_onboarded", "true");
    if (user?.id) {
      localStorage.setItem(`chaicraft_onboarded_${user.id}`, "true");
    }

    // Redirect to role-based workspace
    if (role) {
      navigate(getDefaultDashboard(role), { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-amber-50 via-orange-50/40 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden font-['Outfit']">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-orange-400/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        {/* Top Header Logo */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size="lg" showTagline />
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="amber" size="sm" className="font-bold">
              {role === "ADMIN"
                ? "SUPER ADMIN WORKSPACE"
                : role === "OWNER"
                ? "STORE OWNER ONBOARDING"
                : "BARISTA COUNTER PORTAL"}
            </Badge>
            {user?.email && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Logged in as <strong className="text-slate-700 dark:text-slate-200">{user.email}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Main Onboarding Wizard Card */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
          {/* Top Progress & Step Indicators */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {steps.map((s, idx) => (
                <button
                  key={s.stepNumber}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentStep === idx
                      ? "w-8 bg-amber-500 shadow-sm shadow-amber-500/40"
                      : currentStep > idx
                      ? "w-4 bg-emerald-500"
                      : "w-2.5 bg-slate-200 dark:bg-slate-700"
                  }`}
                  title={`Go to Step ${s.stepNumber}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">
                Step {currentStep + 1} of {steps.length}
              </span>
              <button
                onClick={handleFinish}
                className="text-xs font-bold text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                Skip Walkthrough
              </button>
            </div>
          </div>

          {/* Step Content Banner */}
          <div className={`p-6 sm:p-8 bg-gradient-to-b ${step.themeColor} border-b ${step.borderColor}`}>
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 shrink-0">
                {step.icon}
              </div>
              <div>
                <Badge variant="amber" size="sm" className="mb-2">
                  {step.badge}
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {step.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {step.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Step Features List */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="grid grid-cols-1 gap-3.5">
              {step.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 flex items-start gap-3.5 hover:border-amber-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 shrink-0 mt-0.5">
                    {feat.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="px-6 py-4 sm:px-8 sm:py-5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Button
              variant="outline"
              size="md"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={currentStep === 0 ? "opacity-0 pointer-events-none" : ""}
            >
              Previous
            </Button>

            <div className="flex items-center gap-3">
              {currentStep < steps.length - 1 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNext}
                  className="gap-2 font-bold px-6 shadow-md shadow-amber-500/20"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleFinish}
                  className="gap-2 font-bold px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                >
                  <span>Finish & Enter Workspace</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-xs text-slate-400 text-center">
          You can revisit reports, expenses, and counter billing anytime from your side navigation.
        </p>
      </div>
    </div>
  );
};

export default OnboardingScreen;
