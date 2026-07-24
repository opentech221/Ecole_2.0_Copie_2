import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  const [installing, setInstalling] = useState(false);

  const isIos = useMemo(() => (typeof window !== "undefined" ? isIosDevice() : false), []);
  const isStandalone = useMemo(() => (typeof window !== "undefined" ? isStandaloneMode() : false), []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setHidden(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (hidden || isStandalone) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setHidden(true);
    }
    setDeferredPrompt(null);
    setInstalling(false);
  }

  const shouldShowInstallButton = Boolean(deferredPrompt);
  const shouldShowIosHint = isIos && !shouldShowInstallButton;

  if (!shouldShowInstallButton && !shouldShowIosHint) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: "16px",
        bottom: "max(84px, calc(84px + env(safe-area-inset-bottom)))",
        zIndex: 400,
        maxWidth: "320px",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        backgroundColor: "var(--card)",
        boxShadow: "0 8px 28px rgba(15,23,42,0.16)",
        padding: "12px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      aria-live="polite"
    >
      <p style={{ margin: "0 0 8px", fontSize: "12px", color: "var(--muted-foreground)" }}>
        {shouldShowInstallButton
          ? "Installez Ecole 2.0 pour un accès rapide et une meilleure expérience hors ligne."
          : "Sur Safari iOS : Partager > Sur l'écran d'accueil pour installer l'application."}
      </p>

      {shouldShowInstallButton && (
        <button
          onClick={() => void handleInstall()}
          disabled={installing}
          style={{
            width: "100%",
            border: "none",
            borderRadius: "10px",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
            color: "#fff",
            padding: "10px 12px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: installing ? "wait" : "pointer",
          }}
        >
          {installing ? "Installation..." : "Installer l'application"}
        </button>
      )}

      <button
        onClick={() => setHidden(true)}
        style={{
          marginTop: "8px",
          width: "100%",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          background: "transparent",
          color: "var(--muted-foreground)",
          padding: "6px 10px",
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        Plus tard
      </button>
    </div>
  );
}
