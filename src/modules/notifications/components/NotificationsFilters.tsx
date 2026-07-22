import { BellRing } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import type { NotificationScopeFilter, NotificationTenant } from "../types";

interface NotificationsFiltersProps {
  tenants: NotificationTenant[];
  tenantId: string;
  onTenantChange: (tenantId: string) => void;
  scope: NotificationScopeFilter;
  onScopeChange: (scope: NotificationScopeFilter) => void;
  unreadCount: number;
  onMarkAllRead: () => void;
  busy: boolean;
}

export function NotificationsFilters({
  tenants,
  tenantId,
  onTenantChange,
  scope,
  onScopeChange,
  unreadCount,
  onMarkAllRead,
  busy,
}: NotificationsFiltersProps) {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Centre de notifications</h1>
          <p className="text-sm text-muted-foreground">Suivez les paiements, la facturation et les événements système en temps réel.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">
            <BellRing className="h-4 w-4" /> {unreadCount} Non lues
          </span>
          <Button onClick={onMarkAllRead} disabled={busy || unreadCount === 0}>
            Tout marquer comme lu
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="notif_tenantSelect" className="mb-1 block text-xs font-medium text-muted-foreground">Établissement</label>
          <Select value={tenantId} onValueChange={onTenantChange}>
            <SelectTrigger id="notif_tenantSelect" name="tenantSelect" aria-label="Choisir un établissement">
              <SelectValue placeholder="Sélectionner un établissement" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="notif_scopeFilter" className="mb-1 block text-xs font-medium text-muted-foreground">Filtre</label>
          <Select value={scope} onValueChange={(value) => onScopeChange(value as NotificationScopeFilter)}>
            <SelectTrigger id="notif_scopeFilter" name="scopeFilter" aria-label="Filtrer les notifications">
              <SelectValue placeholder="Choisir un filtre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes</SelectItem>
              <SelectItem value="non_lues">Non lues</SelectItem>
              <SelectItem value="archivees">Archivées</SelectItem>
              <SelectItem value="critiques">Critiques</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
