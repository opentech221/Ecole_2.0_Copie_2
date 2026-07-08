import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsClient } from "../api/notificationsClient";
import type { PushSubscriptionPayload } from "../types";

function base64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }
  return outputArray;
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service worker indisponible sur cet appareil.");
  }

  return navigator.serviceWorker.ready;
}

async function requestPermission() {
  if (!("Notification" in window)) {
    throw new Error("Les notifications push ne sont pas prises en charge.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Autorisation notifications refusée.");
  }
}

function toPayload(subscription: PushSubscription): PushSubscriptionPayload {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
  };
}

export function usePushNotifications(tenantId: string) {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ["notifications", tenantId, "push-status"],
    enabled: Boolean(tenantId),
    queryFn: () => notificationsClient.getPushStatus(tenantId),
    refetchInterval: 60_000,
  });

  async function refreshAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["notifications", tenantId, "push-status"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread", tenantId] }),
    ]);
  }

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const status = await notificationsClient.getPushStatus(tenantId);
      if (!status.pushConfigured || !status.vapidPublicKey) {
        throw new Error("Push non configuré côté serveur.");
      }

      await requestPermission();
      const registration = await getServiceWorkerRegistration();
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(status.vapidPublicKey),
      });

      await notificationsClient.subscribePush(tenantId, {
        ...toPayload(subscription),
        deviceLabel: window.navigator.platform || null,
      });
    },
    onSuccess: async () => {
      toast.success("Notifications push activées.");
      await refreshAll();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Impossible d'activer le push.");
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const registration = await getServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await notificationsClient.unsubscribePush(tenantId, { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
    },
    onSuccess: async () => {
      toast.success("Notifications push désactivées.");
      await refreshAll();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Impossible de désactiver le push.");
    },
  });

  const testPushMutation = useMutation({
    mutationFn: async () => notificationsClient.sendTestPush(tenantId),
    onSuccess: () => {
      toast.success("Notification de test envoyée.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Impossible d'envoyer le test push.");
    },
  });

  const status = useMemo(() => statusQuery.data ?? {
    pushConfigured: false,
    vapidPublicKey: null,
    subscriptionEnabled: false,
    hasSubscription: false,
    syncSupported: false,
  }, [statusQuery.data]);

  return {
    status,
    statusQuery,
    subscribeMutation,
    unsubscribeMutation,
    testPushMutation,
  };
}
