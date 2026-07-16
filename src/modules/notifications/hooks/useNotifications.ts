import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsClient } from "../api/notificationsClient";
import type { NotificationFilterState } from "../types";

const keys = {
  tenants: ["notifications", "tenants"] as const,
  list: (tenantId: string, filters: NotificationFilterState) => ["notifications", tenantId, filters] as const,
  unread: (tenantId?: string) => ["notifications", "unread", tenantId ?? "all"] as const,
};

export function useNotifications() {
  const queryClient = useQueryClient();
  const [tenantId, setTenantId] = useState("");
  const [filters, setFilters] = useState<NotificationFilterState>({
    page: 1,
    pageSize: 12,
    scope: "toutes",
  });

  const tenantsQuery = useQuery({
    queryKey: keys.tenants,
    queryFn: async () => {
      const response = await notificationsClient.getTenants();
      return response.data;
    },
  });

  const resolvedTenantId = tenantId || tenantsQuery.data?.[0]?.id || "";
  const shouldPollUnread = Boolean(resolvedTenantId) && !import.meta.env.DEV && (typeof navigator === "undefined" || navigator.onLine);

  const listQuery = useQuery({
    queryKey: keys.list(resolvedTenantId, filters),
    enabled: Boolean(resolvedTenantId) && !import.meta.env.DEV,
    queryFn: () => notificationsClient.getNotifications(resolvedTenantId, filters),
  });

  const unreadCountQuery = useQuery({
    queryKey: keys.unread(resolvedTenantId),
    enabled: Boolean(resolvedTenantId),
    queryFn: async () => {
      try {
        return await notificationsClient.getUnreadCount(resolvedTenantId);
      } catch (error) {
        if (import.meta.env.DEV) {
          return { unreadCount: 0 };
        }
        throw error;
      }
    },
    refetchInterval: shouldPollUnread ? 30_000 : false,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.list(resolvedTenantId, filters) }),
      queryClient.invalidateQueries({ queryKey: keys.unread(resolvedTenantId) }),
      queryClient.invalidateQueries({ queryKey: keys.unread(undefined) }),
    ]);
  };

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsClient.markAsRead(resolvedTenantId, notificationId),
    onSuccess: (result) => {
      toast.success(result.queued ? "Action enregistrée hors ligne, synchronisation en attente." : "Notification marquée comme lue.");
      void refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur de mise à jour");
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsClient.markAllAsRead(resolvedTenantId),
    onSuccess: (result) => {
      toast.success(result.queued ? "Actions enregistrées hors ligne, synchronisation en attente." : "Toutes les notifications sont marquées comme lues.");
      void refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur de mise à jour");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsClient.archive(resolvedTenantId, notificationId),
    onSuccess: (result) => {
      toast.success(result.queued ? "Archivage mis en file hors ligne." : "Notification archivée.");
      void refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur archivage");
    },
  });

  const isBusy = markReadMutation.isPending || markAllMutation.isPending || archiveMutation.isPending;

  const unreadCount = useMemo(() => unreadCountQuery.data?.unreadCount ?? 0, [unreadCountQuery.data?.unreadCount]);

  return {
    tenantId: resolvedTenantId,
    setTenantId,
    filters,
    setFilters,
    tenantsQuery,
    listQuery,
    unreadCountQuery,
    unreadCount,
    markReadMutation,
    markAllMutation,
    archiveMutation,
    refresh,
    isBusy,
  };
}
