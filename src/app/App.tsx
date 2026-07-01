import { RouterProvider }      from "react-router";
import { Toaster }             from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { router }              from "./routes";
import { ThemeProvider }       from "./contexts/ThemeContext";
import { AuthProvider }        from "./contexts/AuthContext";
import { AppProvider }         from "./contexts/AppContext";
import { queryClient }         from "../lib/queryClient";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ThemeProvider is outermost — applies CSS class to <html> instantly
          from localStorage before any auth round-trip completes.            */}
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <RouterProvider router={router} />
            <Toaster
              position="bottom-center"
              richColors
              closeButton
              toastOptions={{ style: { fontFamily: "'Plus Jakarta Sans', sans-serif" } }}
            />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
