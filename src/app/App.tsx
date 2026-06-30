import { RouterProvider }      from "react-router";
import { Toaster }             from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { router }              from "./routes";
import { AuthProvider }        from "./contexts/AuthContext";
import { AppProvider }         from "./contexts/AppContext";
import { queryClient }         from "../lib/queryClient";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* AuthProvider is outermost so AppProvider and all routes can
          read session / profile via useAuthContext()                    */}
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
    </QueryClientProvider>
  );
}
