export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => {
        console.warn("Échec enregistrement service worker", error);
      });
  });

  window.addEventListener("online", async () => {
    const registration = await navigator.serviceWorker.ready.catch(() => null);
    registration?.active?.postMessage({ type: "REPLAY_NOTIFICATION_QUEUE" });
  });
}
