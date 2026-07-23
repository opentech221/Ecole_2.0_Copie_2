import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "../contexts/AppContext";
import { queryClient } from "../../lib/queryClient";
import { AppLayout } from "./AppLayout";
import "../../styles/index.css";

export function ProtectedAppShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AppLayout />
        <Toaster
          position="bottom-center"
          richColors
          closeButton
          toastOptions={{ style: { fontFamily: "'Plus Jakarta Sans', sans-serif" } }}
        />
      </AppProvider>
    </QueryClientProvider>
  );
}
