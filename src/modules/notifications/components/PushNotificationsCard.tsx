import { BellRing, CloudOff, Send, Smartphone } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import type { PushStatusResult } from "../types";

interface PushNotificationsCardProps {
  status: PushStatusResult;
  loading: boolean;
  statusError?: string | null;
  hasTenant: boolean;
  supportsPushApi: boolean;
  enabling: boolean;
  disabling: boolean;
  testing: boolean;
  onEnable: () => void;
  onDisable: () => void;
  onTest: () => void;
}

export function PushNotificationsCard({
  status,
  loading,
  statusError,
  hasTenant,
  supportsPushApi,
  enabling,
  disabling,
  testing,
  onEnable,
  onDisable,
  onTest,
}: PushNotificationsCardProps) {
  return (
    <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4" /> Mobile avancé
            </div>
            <h2 className="text-lg font-semibold">Notifications push et sync hors ligne</h2>
            <p className="text-sm text-muted-foreground">
              Recevez les alertes critiques sur mobile et synchronisez automatiquement les actions
              “Marquer comme lu” ou “Archiver” après une coupure réseau.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold dark:border-slate-700">
            {status.subscriptionEnabled ? "Push actif" : "Push inactif"}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200/70 p-3 dark:border-slate-800">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Notifications Web</p>
            <p className="text-sm font-semibold">{status.pushConfigured ? "Configuré" : "À configurer"}</p>
          </div>
          <div className="rounded-xl border border-slate-200/70 p-3 dark:border-slate-800">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Abonnement navigateur</p>
            <p className="text-sm font-semibold">
              {!hasTenant ? "En attente" : (status.hasSubscription ? "Détecté" : "Absent")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/70 p-3 dark:border-slate-800">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Synchronisation en arrière-plan</p>
            <p className="text-sm font-semibold">{status.syncSupported ? "Pris en charge" : "Repli manuel"}</p>
          </div>
        </div>

        {!hasTenant && !loading && (
          <div className="rounded-xl border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-100">
            Sélectionnez d'abord un établissement pour vérifier la configuration push.
          </div>
        )}

        {!supportsPushApi && !loading && hasTenant && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            Ce navigateur mobile ne prend pas en charge les notifications Web pour cette application.
            Utilisez Chrome/Edge Android ou Safari iOS 16.4+ avec l'application ajoutée à l'écran d'accueil.
          </div>
        )}

        {statusError && !loading && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            Statut push indisponible: {statusError}. Vérifiez la configuration CORS (ALLOWED_ORIGINS)
            et l'authentification utilisateur.
          </div>
        )}

        {!status.pushConfigured && !loading && !statusError && hasTenant && supportsPushApi && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            Clés VAPID absentes côté serveur. Renseignez VITE_VAPID_PUBLIC_KEY, VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY et VAPID_SUBJECT pour activer les push réels.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!status.subscriptionEnabled ? (
            <Button disabled={loading || enabling || !hasTenant || !supportsPushApi || !status.pushConfigured} onClick={onEnable}>
              <BellRing className="mr-2 h-4 w-4" /> Activer les notifications push
            </Button>
          ) : (
            <Button variant="outline" disabled={loading || disabling} onClick={onDisable}>
              <CloudOff className="mr-2 h-4 w-4" /> Désactiver le push
            </Button>
          )}
          <Button variant="secondary" disabled={loading || testing || !hasTenant || !status.subscriptionEnabled} onClick={onTest}>
            <Send className="mr-2 h-4 w-4" /> Envoyer un test push
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
