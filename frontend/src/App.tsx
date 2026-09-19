import React, { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRoutes } from "@/routes/AppRoutes";
import { useAuthStore } from "@/stores/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// App root: restores Supabase session on page load/refresh before rendering routes.
const AppInner: React.FC = () => {
  const initSession = useAuthStore((s) => s.initSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initSession().finally(() => setReady(true));
  }, []);

  if (!ready) {
    // Minimal full-screen loader while session is being checked
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading session…</p>
        </div>
      </div>
    );
  }

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
