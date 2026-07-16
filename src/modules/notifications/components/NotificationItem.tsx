import { ExternalLink, Eye, Archive } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import type { NotificationRecord } from "../types";
import { canOpenAction, getNotificationTypeMeta, priorityLabel, statusLabel, toRelativeDate } from "../services/notificationService";

interface NotificationItemProps {
  item: NotificationRecord;
  busy: boolean;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
}

export function NotificationItem({ item, busy, onMarkRead, onArchive }: NotificationItemProps) {
  const meta = getNotificationTypeMeta(item.type);
  const Icon = meta.icon;

  return (
    <article className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-100 p-2 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{meta.label}</p>
            <h3 className="text-base font-semibold leading-tight">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.message}</p>
            <p className="text-xs text-muted-foreground">{toRelativeDate(item.created_at)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={item.priority === "critique" ? "destructive" : "outline"}>{priorityLabel(item.priority)}</Badge>
          <Badge variant={item.status === "non_lue" ? "default" : "secondary"}>{statusLabel(item.status)}</Badge>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {item.status === "non_lue" && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onMarkRead(item.id)} aria-label={`Marquer ${item.title} comme lu`}>
            <Eye className="mr-1 h-4 w-4" /> Marquer comme lu
          </Button>
        )}
        {item.status !== "archivee" && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onArchive(item.id)} aria-label={`Archiver ${item.title}`}>
            <Archive className="mr-1 h-4 w-4" /> Archiver
          </Button>
        )}
        {canOpenAction(item) && (
          <Button asChild size="sm" variant="secondary">
            <a href={item.action_url ?? "#"} target="_blank" rel="noreferrer" aria-label={`Ouvrir l'action ${item.title}`}>
              <ExternalLink className="mr-1 h-4 w-4" /> Ouvrir
            </a>
          </Button>
        )}
      </div>
    </article>
  );
}
