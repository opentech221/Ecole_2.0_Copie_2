import { RouterProvider }      from "react-router";
import { Toaster }             from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { Analytics }         from "@vercel/analytics/react";
import { SpeedInsights }     from "@vercel/speed-insights/react";
import { router }            from "./routes";
import { AppProvider }       from "./contexts/AppContext";
import { AuthProvider }      from "./contexts/AuthContext";
import { ThemeProvider }     from "./contexts/ThemeContext";
import { queryClient }       from "../lib/queryClient";

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
            <Analytics />
            <SpeedInsights />
          </AppProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
