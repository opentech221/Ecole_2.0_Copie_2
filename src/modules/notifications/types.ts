export const notificationTypes = [
  "paiement_reussi",
  "paiement_echoue",
  "facture_generee",
  "abonnement_expire_bientot",
  "abonnement_suspendu",
  "nouvel_utilisateur",
  "rappel_impaye",
  "systeme",
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export const notificationPriorities = ["faible", "normale", "haute", "critique"] as const;
export type NotificationPriority = (typeof notificationPriorities)[number];

export const notificationStatuses = ["non_lue", "lue", "archivee"] as const;
export type NotificationStatus = (typeof notificationStatuses)[number];

export const notificationChannels = ["in_app", "email"] as const;
export type NotificationChannel = (typeof notificationChannels)[number];

export type NotificationScopeFilter = "toutes" | "non_lues" | "archivees" | "critiques";

export interface NotificationRecord {
  id: string;
  tenant_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  priority: NotificationPriority;
  status: NotificationStatus;
  channel: NotificationChannel;
  action_url: string | null;
  created_at: string;
  read_at: string | null;
  archived_at: string | null;
}

export interface NotificationListResult {
  rows: NotificationRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface NotificationUnreadCountResult {
  unreadCount: number;
}

export interface NotificationTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface NotificationFilterState {
  page: number;
  pageSize: number;
  scope: NotificationScopeFilter;
}

export interface NotificationCreateInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channel: NotificationChannel;
  actionUrl?: string | null;
  data?: Record<string, unknown>;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushStatusResult {
  pushConfigured: boolean;
  vapidPublicKey: string | null;
  subscriptionEnabled: boolean;
  hasSubscription: boolean;
  syncSupported: boolean;
}
