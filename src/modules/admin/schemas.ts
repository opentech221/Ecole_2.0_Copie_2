import { z } from "zod";

export const paymentFiltersSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  search: z.string().trim().default(""),
  status: z.enum(["all", "pending", "paid", "failed", "refunded", "partially_refunded", "disputed"]).default("all"),
  paymentMethod: z.string().trim().default("all"),
  reconciliationStatus: z.enum(["all", "matched", "unmatched", "manual_review"]).default("all"),
});

export const planUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).nullable().default(null),
  billingInterval: z.enum(["monthly", "annual"]),
  amountCents: z.number().int().min(0),
  currency: z.string().trim().min(3).max(3).default("XOF"),
  trialDays: z.number().int().min(0).max(365).default(0),
  taxRateBasisPoints: z.number().int().min(0).max(10000).default(0),
  studentLimit: z.number().int().positive().nullable().default(null),
  active: z.boolean().default(true),
  features: z.array(z.string().trim().min(1)).default([]),
});

export const refundSchema = z.object({
  amountCents: z.number().int().positive(),
  reason: z.string().trim().min(3).max(240),
});

export const markOfflineSchema = z.object({
  amountCents: z.number().int().positive().optional(),
  note: z.string().trim().min(3).max(240),
});

export const reminderSchema = z.object({
  channel: z.enum(["email", "in_app", "sms"]).default("email"),
  message: z.string().trim().min(5).max(500).optional(),
});

export const noteSchema = z.object({
  note: z.string().trim().min(2).max(1000),
});

export const summaryFiltersSchema = z.object({
  period: z.enum(["7d", "30d", "90d", "12m"]).default("30d"),
  planId: z.string().uuid().optional(),
  country: z.string().trim().min(2).max(3).optional(),
  channel: z.string().trim().min(2).max(80).optional(),
});

export const adminUserFiltersSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().trim().default(""),
  status: z.enum(["all", "active", "suspended", "pending_invite", "deleted"]).default("all"),
  role: z.enum(["all", "owner", "super_admin", "admin_finance", "support", "director"]).default("all"),
  sortBy: z.enum(["created_at", "last_seen_at", "full_name", "email", "status"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const adminUserCreateSchema = z.object({
  email: z.string().trim().email(),
  fullName: z.string().trim().min(2).max(160),
  roleCode: z.enum(["owner", "super_admin", "admin_finance", "support", "director"]),
  status: z.enum(["active", "suspended", "pending_invite"]).default("active"),
  countryCode: z.string().trim().min(2).max(3).default("SN"),
  acquisitionChannel: z.string().trim().min(2).max(80).default("direct"),
  password: z.string().min(8).optional(),
  sendInvite: z.boolean().default(true),
});

export const adminUserUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(160).optional(),
  roleCode: z.enum(["owner", "super_admin", "admin_finance", "support", "director"]).optional(),
  status: z.enum(["active", "suspended", "pending_invite", "deleted"]).optional(),
  countryCode: z.string().trim().min(2).max(3).optional(),
  acquisitionChannel: z.string().trim().min(2).max(80).optional(),
  suspendedReason: z.string().trim().min(3).max(240).optional(),
});

export const suspendUserSchema = z.object({
  reason: z.string().trim().min(3).max(240),
});

export const reactivateUserSchema = z.object({
  reason: z.string().trim().min(3).max(240).optional(),
});

export const resetPasswordSchema = z.object({
  redirectTo: z.string().trim().url().optional(),
});

export const deleteUserSchema = z.object({
  hardDelete: z.boolean().default(false),
  reason: z.string().trim().min(3).max(240).optional(),
});

export const importUsersCsvSchema = z.object({
  csv: z.string().trim().min(1),
});

export type PaymentFiltersInput = z.infer<typeof paymentFiltersSchema>;
export type PlanUpsertInput = z.infer<typeof planUpsertSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
export type MarkOfflineInput = z.infer<typeof markOfflineSchema>;
export type ReminderInput = z.infer<typeof reminderSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type SummaryFiltersInput = z.infer<typeof summaryFiltersSchema>;
export type AdminUserFiltersInput = z.infer<typeof adminUserFiltersSchema>;
export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type ReactivateUserInput = z.infer<typeof reactivateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
export type ImportUsersCsvInput = z.infer<typeof importUsersCsvSchema>;