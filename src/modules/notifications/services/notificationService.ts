import { formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, BellDot, BadgeAlert, BadgeCheck, CreditCard, FileText, ShieldAlert, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NotificationPriority, NotificationRecord, NotificationStatus, NotificationType } from "../types";

const typeMeta: Record<NotificationType, { icon: LucideIcon; label: string }> = {
  paiement_reussi: { icon: BadgeCheck, label: "Paiement réussi" },
  paiement_echoue: { icon: BadgeAlert, label: "Paiement échoué" },
  facture_generee: { icon: FileText, label: "Facture générée" },
  abonnement_expire_bientot: { icon: BellDot, label: "Abonnement expire bientôt" },
  abonnement_suspendu: { icon: ShieldAlert, label: "Abonnement suspendu" },
  nouvel_utilisateur: { icon: UserPlus, label: "Nouvel utilisateur" },
  rappel_impaye: { icon: CreditCard, label: "Rappel impayé" },
  systeme: { icon: Bell, label: "Système" },
};

export function getNotificationTypeMeta(type: NotificationType) {
  return typeMeta[type] ?? { icon: Bell, label: "Système" };
}

export function toRelativeDate(value: string) {
  return formatDistanceToNowStrict(new Date(value), {
    addSuffix: true,
    locale: fr,
  });
}

export function priorityLabel(priority: NotificationPriority) {
  switch (priority) {
    case "critique":
      return "Priorité critique";
    case "haute":
      return "Priorité haute";
    case "faible":
      return "Priorité faible";
    default:
      return "Priorité normale";
  }
}

export function statusLabel(status: NotificationStatus) {
  switch (status) {
    case "non_lue":
      return "Non lue";
    case "archivee":
      return "Archivée";
    default:
      return "Lue";
  }
}

export function canOpenAction(notification: NotificationRecord) {
  return Boolean(notification.action_url && notification.action_url.trim().length > 0);
}
