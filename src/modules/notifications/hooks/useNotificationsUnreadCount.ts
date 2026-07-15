import { useQuery } from "@tanstack/react-query";
import { notificationsClient } from "../api/notificationsClient";

export function useNotificationsUnreadCount(enabled = true) {
  const shouldPoll = enabled && !import.meta.env.DEV && (typeof navigator === "undefined" || navigator.onLine);

  const query = useQuery({
    queryKey: ["notifications", "unread", "all"],
    enabled: enabled && !import.meta.env.DEV,
    queryFn: async () => {
      try {
        return await notificationsClient.getUnreadCount();
      } catch (error) {
        if (import.meta.env.DEV) {
          return { unreadCount: 0 };
        }
        throw error;
      }
    },
    refetchInterval: shouldPoll ? 30_000 : false,
    refetchIntervalInBackground: false,
    retry: false,
  });

  return {
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
  };
}
