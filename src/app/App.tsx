import React, { useEffect, useState } from "react";
import { RouterProvider }      from "react-router";
import { Toaster }             from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { router }            from "./routes";
import { AppProvider }       from "./contexts/AppContext";
import { AuthProvider }      from "./contexts/AuthContext";
import { ThemeProvider }     from "./contexts/ThemeContext";
import { queryClient }       from "../lib/queryClient";

function DeferredTelemetry() {
  const [telemetryReady, setTelemetryReady] = useState(false);

  useEffect(() => {
    let timeoutId = 0;
    let idleId: number | null = null;

    const startTelemetry = () => setTelemetryReady(true);

    if ("requestIdleCallback" in window) {
      idleId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
        startTelemetry,
        { timeout: 8000 },
      );
    } else {
      timeoutId = window.setTimeout(startTelemetry, 4000);
    }

    return () => {
      if (idleId !== null && "cancelIdleCallback" in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!telemetryReady || import.meta.env.DEV) {
    return null;
  }

  const Analytics = React.lazy(() => import("@vercel/analytics/react").then((mod) => ({ default: mod.Analytics })));
  const SpeedInsights = React.lazy(() => import("@vercel/speed-insights/react").then((mod) => ({ default: mod.SpeedInsights })));

  return (
    <React.Suspense fallback={null}>
      <Analytics />
      <SpeedInsights />
    </React.Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <AppProvider>
            <RouterProvider router={router} />
            {/* Global toast layer — used by apiService.performAction and
                the Optimistic Undo handler in useGradesMutation.            */}
            <Toaster
              position="bottom-center"
              richColors
              closeButton
              toastOptions={{ style: { fontFamily: "'Plus Jakarta Sans', sans-serif" } }}
            />
            <DeferredTelemetry />
          </AppProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
