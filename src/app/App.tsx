import React, { useEffect, useState } from "react";
import { RouterProvider }      from "react-router";
import { router }            from "./routes";
import { AuthProvider }      from "./contexts/AuthContext";
import { ThemeProvider }     from "./contexts/ThemeContext";

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
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
        <DeferredTelemetry />
      </ThemeProvider>
    </AuthProvider>
  );
}
