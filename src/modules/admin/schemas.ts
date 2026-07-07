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

export type PaymentFiltersInput = z.infer<typeof paymentFiltersSchema>;
export type PlanUpsertInput = z.infer<typeof planUpsertSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
export type MarkOfflineInput = z.infer<typeof markOfflineSchema>;
export type ReminderInput = z.infer<typeof reminderSchema>;
export type NoteInput = z.infer<typeof noteSchema>;