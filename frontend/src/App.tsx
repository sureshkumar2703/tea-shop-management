import React, { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRoutes } from "@/routes/AppRoutes";
import { useAuthStore } from "@/stores/authStore";
import { WifiOff, RefreshCw } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Full-screen Offline Screen
const OfflineScreen: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/60 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center">
        {/* Animated Icon Container */}
        <div className="w-24 h-24 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center mb-6 shadow-inner">
          <WifiOff className="w-12 h-12 text-rose-500 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">
          No Internet Connection
        </h1>

        {/* Description */}
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          It looks like you are offline. Please check your Wi-Fi or mobile data connection to continue using ChaiCraft.
        </p>

        {/* Retry Button */}
        <button
          onClick={onRetry}
          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition duration-200 active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Check Again</span>
        </button>
      </div>
    </div>
  );
};

// App root: restores Supabase session on page load/refresh before rendering routes.
const AppInner: React.FC = () => {
  const initSession = useAuthStore((s) => s.initSession);
  const [ready, setReady] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    initSession().finally(() => setReady(true));
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      setIsOnline(true);
      window.location.reload();
    } else {
      setIsOnline(false);
    }
  };

  // 1. If offline, replace entire page with the No Internet screen
  if (!isOnline) {
    return <OfflineScreen onRetry={handleRetry} />;
  }

  // 2. Loading state while session is being verified
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading session…</p>
        </div>
      </div>
    );
  }

  // 3. Normal app render when online
  return <AppRoutes />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
