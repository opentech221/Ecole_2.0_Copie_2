import { useState, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: ReactNode;
}

/**
 * Portal — injects children into document.body via ReactDOM.createPortal.
 * The "mounted" pattern delays injection until after React's commit phase
 * so the portal never races with commitMutationEffects.
 */
export function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
