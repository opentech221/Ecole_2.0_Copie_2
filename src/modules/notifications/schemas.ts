import { z } from "zod";
import { notificationChannels, notificationPriorities, notificationStatuses, notificationTypes } from "./types";

export const notificationListFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  scope: z.enum(["toutes", "non_lues", "archivees", "critiques"]).default("toutes"),
});

export const createNotificationSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(notificationTypes),
  title: z.string().trim().min(2).max(140),
  message: z.string().trim().min(2).max(1500),
  priority: z.enum(notificationPriorities).default("normale"),
  channel: z.enum(notificationChannels).default("in_app"),
  actionUrl: z.string().trim().url().nullable().optional(),
  data: z.record(z.unknown()).default({}),
});

export const notificationUpdateStatusSchema = z.object({
  status: z.enum(notificationStatuses),
});

export type NotificationListFilterInput = z.input<typeof notificationListFilterSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
