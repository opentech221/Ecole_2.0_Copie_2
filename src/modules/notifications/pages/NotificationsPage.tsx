import { AlertCircle, BellOff, RefreshCcw } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationItem } from "../components/NotificationItem";
import { NotificationsFilters } from "../components/NotificationsFilters";
import { NotificationsSkeleton } from "../components/NotificationsSkeleton";
import { PushNotificationsCard } from "../components/PushNotificationsCard";
import { usePushNotifications } from "../hooks/usePushNotifications";

export function NotificationsPage() {
  const {
    tenantId,
    setTenantId,
    filters,
    setFilters,
    tenantsQuery,
    listQuery,
    unreadCount,
    markReadMutation,
    markAllMutation,
    archiveMutation,
    refresh,
    isBusy,
  } = useNotifications();
  const push = usePushNotifications(tenantId);

  const notifications = listQuery.data?.rows ?? [];

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(2,132,199,0.10),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(15,118,110,0.10),_transparent_30%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,1))] p-4 md:p-6 dark:bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.22),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(15,118,110,0.20),_transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,6,23,1))]">
      <div className="mx-auto max-w-5xl space-y-5">
        <NotificationsFilters
          tenants={tenantsQuery.data ?? []}
          tenantId={tenantId}
          onTenantChange={setTenantId}
          scope={filters.scope}
          onScopeChange={(scope) => setFilters((prev) => ({ ...prev, page: 1, scope }))}
          unreadCount={unreadCount}
          onMarkAllRead={() => markAllMutation.mutate()}
          busy={isBusy}
        />

        <PushNotificationsCard
          status={push.status}
          loading={push.statusQuery.isLoading}
          enabling={push.subscribeMutation.isPending}
          disabling={push.unsubscribeMutation.isPending}
          testing={push.testPushMutation.isPending}
          onEnable={() => push.subscribeMutation.mutate()}
          onDisable={() => push.unsubscribeMutation.mutate()}
          onTest={() => push.testPushMutation.mutate()}
        />

        {listQuery.isLoading ? (
          <NotificationsSkeleton />
        ) : listQuery.isError ? (
          <Card className="border-destructive/40">
            <CardContent className="space-y-3 p-6 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
              <p className="font-medium">Impossible de charger les notifications.</p>
              <Button variant="outline" onClick={() => void refresh()}>
                <RefreshCcw className="mr-1 h-4 w-4" /> Réessayer
              </Button>
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="space-y-3 p-10 text-center">
              <BellOff className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Aucune notification pour le moment</h2>
              <p className="text-sm text-muted-foreground">Les nouvelles activités apparaîtront ici automatiquement.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                busy={isBusy}
                onMarkRead={(id) => markReadMutation.mutate(id)}
                onArchive={(id) => archiveMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
