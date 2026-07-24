export type AdminConsoleRole = "super_admin" | "admin_finance" | "support" | "owner";

export interface AdminTenantSummary {
  id: string;
  name: string;
  slug: string;
  status: "active" | "trialing" | "suspended" | "archived";
  currency: string;
}

export interface ExecutiveKpi {
  label: string;
  value: number;
  currency?: string;
  deltaPct?: number;
  tone: "good" | "neutral" | "warn" | "danger";
}

export interface RevenuePoint {
  label: string;
  paidAmountCents: number;
  failedAmountCents: number;
}

export interface DistributionPoint {
  key: string;
  label: string;
  value: number;
}

export interface AdminAlert {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warn" | "critical";
  category: "payments" | "subscriptions" | "webhooks" | "compliance";
  createdAt: string;
}

export interface AdminDashboardSummary {
  tenant: AdminTenantSummary;
  userRole: AdminConsoleRole | "director";
  filtersApplied?: {
    period: "7d" | "30d" | "90d" | "12m";
    planId: string | null;
    country: string | null;
    channel: string | null;
  };
  kpis: {
    mrr: ExecutiveKpi;
    arr: ExecutiveKpi;
    monthRevenue: ExecutiveKpi;
    successPayments: ExecutiveKpi;
    failedPayments: ExecutiveKpi;
    unpaid: ExecutiveKpi;
    recoveryRate: ExecutiveKpi;
    churnRate: ExecutiveKpi;
    estimatedLtv: ExecutiveKpi;
  };
  charts: {
    revenue7d: RevenuePoint[];
    revenue30d: RevenuePoint[];
    revenue12m: RevenuePoint[];
    byTenant: DistributionPoint[];
    byLevel: DistributionPoint[];
    byPaymentMethod: DistributionPoint[];
  };
  business?: {
    kpis: {
      activeUsers: number;
      newSignups: number;
      grossRevenue: number;
      netRevenue: number;
      conversionRate: number;
      momGrowth: number;
      arpu: number;
      aov: number;
    };
    funnel: Array<{ stage: string; value: number }>;
    cohorts: Array<{ cohortMonth: string; activityMonth: string; activeUsers: number; retentionPct: number }>;
    forecast: Array<{ horizonMonths: number; projectedRevenueCents: number }>;
    acquisition: Array<{ channel: string; users: number }>;
  };
  alerts: AdminAlert[];
}

export interface SummaryFilters {
  period: "7d" | "30d" | "90d" | "12m";
  planId?: string;
  country?: string;
  channel?: string;
}

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded" | "disputed";

export interface PaymentListItem {
  id: string;
  tenantId: string;
  tenantName: string;
  studentId: string | null;
  studentName: string;
  parentName: string | null;
  parentEmail: string | null;
  classId: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  subscriptionId: string | null;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  provider: string;
  reconciliationStatus: "matched" | "unmatched" | "manual_review";
  createdAt: string;
  paidAt: string | null;
  failureReason: string | null;
}

export interface PaymentAttemptRecord {
  id: string;
  attemptNumber: number;
  provider: string;
  status: "pending" | "succeeded" | "failed" | "canceled";
  responseCode: string | null;
  responseMessage: string | null;
  attemptedAt: string;
}

export interface RefundRecord {
  id: string;
  amountCents: number;
  status: "pending" | "succeeded" | "failed";
  reason: string | null;
  createdAt: string;
}

export interface PaymentDetail extends PaymentListItem {
  subscriptionStatus: string | null;
  invoiceStatus: string | null;
  internalNotes: string | null;
  attempts: PaymentAttemptRecord[];
  refunds: RefundRecord[];
}

export interface PaymentsPageResult {
  rows: PaymentListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PaymentFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PaymentStatus | "all";
  paymentMethod?: string | "all";
  reconciliationStatus?: "matched" | "unmatched" | "manual_review" | "all";
}

export interface PlanRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  billingInterval: "monthly" | "annual";
  amountCents: number;
  currency: string;
  trialDays: number;
  taxRateBasisPoints: number;
  studentLimit: number | null;
  active: boolean;
  features: string[];
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  status: "draft" | "open" | "paid" | "overdue" | "void" | "uncollectible";
  studentName: string;
  dueDate: string;
  totalCents: number;
  balanceCents: number;
  paidCents: number;
  currency: string;
}

export interface SubscriptionRecord {
  id: string;
  subscriberName: string;
  subscriberEmail: string | null;
  status: "trialing" | "active" | "past_due" | "suspended" | "canceled" | "expired";
  billingCycle: "monthly" | "annual";
  currentPeriodEnd: string | null;
  amountCents: number;
  currency: string;
  planName: string | null;
}

export interface BillingSnapshot {
  plans: PlanRecord[];
  invoices: InvoiceRecord[];
  subscriptions: SubscriptionRecord[];
}

export interface AuditEntry {
  id: string;
  action: string;
  actorRole: string | null;
  entityType: string;
  severity: "info" | "warn" | "critical";
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditResult {
  rows: AuditEntry[];
}

export type AdminUserStatus = "active" | "suspended" | "pending_invite" | "deleted";

export type AdminUserRole = "owner" | "super_admin" | "admin_finance" | "support" | "director";

export interface AdminUserListItem {
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  roleCode: AdminUserRole;
  status: AdminUserStatus;
  countryCode: string;
  acquisitionChannel: string;
  lastSeenAt: string | null;
  suspendedReason: string | null;
  suspendedAt: string | null;
  reactivatedAt: string | null;
  createdAt: string;
}

export interface AdminUsersPageResult {
  rows: AdminUserListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminAuthUserListItem {
  userId: string;
  email: string;
  fullName: string;
  createdAt: string;
  lastSignInAt: string | null;
}

export interface AdminAuthUsersResult {
  rows: AdminAuthUserListItem[];
  total: number;
}

export interface AdminUserDetail extends AdminUserListItem {
  metadata: Record<string, unknown>;
  auditTrail: Array<{
    id: string;
    action: string;
    severity: "info" | "warn" | "critical";
    metadata: Record<string, unknown>;
    createdAt: string;
  }>;
}

export interface AdminUserFilters {
  page: number;
  pageSize: number;
  search: string;
  status: "all" | AdminUserStatus;
  role: "all" | AdminUserRole;
  sortBy: "created_at" | "last_seen_at" | "full_name" | "email" | "status";
  sortOrder: "asc" | "desc";
}

export interface AdminConsoleContext {
  tenantId: string;
  role: AdminConsoleRole | "director";
}