import { useQuery } from "@tanstack/react-query";
import { notificationsClient } from "../api/notificationsClient";

export function useNotificationsUnreadCount(enabled = true) {
  const query = useQuery({
    queryKey: ["notifications", "unread", "all"],
    enabled,
    queryFn: () => notificationsClient.getUnreadCount(),
    refetchInterval: 30_000,
  });

  return {
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
  };
}
