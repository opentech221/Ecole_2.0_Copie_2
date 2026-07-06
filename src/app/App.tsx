import { RouterProvider }      from "react-router";
import { Toaster }             from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { router }              from "./routes";
import { ThemeProvider, useTheme }       from "./contexts/ThemeContext";
import { AuthProvider }        from "./contexts/AuthContext";
import { AppProvider }         from "./contexts/AppContext";
import { queryClient }         from "../lib/queryClient";

function AppShell() {
  const { theme } = useTheme();

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-center"
        richColors
        closeButton
        theme={theme}
        toastOptions={{ style: { fontFamily: "var(--font-sans)" } }}
      />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ThemeProvider is outermost — applies CSS class to <html> instantly
          from localStorage before any auth round-trip completes.            */}
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <AppShell />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
