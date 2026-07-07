import { describe, expect, it } from "vitest";
import { paymentFiltersSchema, planUpsertSchema, refundSchema } from "./schemas";

describe("admin schemas", () => {
  it("parses default payment filters", () => {
    const parsed = paymentFiltersSchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(10);
    expect(parsed.status).toBe("all");
  });

  it("validates plan payload", () => {
    const parsed = planUpsertSchema.parse({
      code: "smart-monthly",
      name: "Smart mensuel",
      billingInterval: "monthly",
      amountCents: 49000,
      features: ["dashboard"],
    });
    expect(parsed.currency).toBe("XOF");
  });

  it("rejects invalid refund amount", () => {
    expect(() => refundSchema.parse({ amountCents: 0, reason: "x" })).toThrow();
  });
});