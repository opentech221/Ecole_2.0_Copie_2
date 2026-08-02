import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BillingWorkspace } from "./BillingWorkspace";
import { formatMoney } from "../utils";
import type { BillingSnapshot, PlanRecord } from "../types";

// Jeu de données minimal mais représentatif des trois onglets
// (plans / abonnements / factures) manipulés par le composant.
const snapshot: BillingSnapshot = {
  plans: [
    {
      id: "plan_essentiel",
      code: "ESSENTIEL",
      name: "Essentiel",
      description: "Pour les petites écoles",
      billingInterval: "monthly",
      amountCents: 500000, // 5 000 XOF
      currency: "XOF",
      trialDays: 14,
      taxRateBasisPoints: 1800, // 18%
      studentLimit: 150,
      active: true,
      features: ["Cahier de roulement", "Planning"],
    },
    {
      id: "plan_pro",
      code: "PRO",
      name: "Pro",
      description: null,
      billingInterval: "annual",
      amountCents: 4800000,
      currency: "XOF",
      trialDays: 0,
      taxRateBasisPoints: 1800,
      studentLimit: null,
      active: false,
      features: [],
    },
  ],
  subscriptions: [
    {
      id: "sub_1",
      subscriberName: "École Les Flamboyants",
      subscriberEmail: "contact@flamboyants.sn",
      status: "past_due",
      billingCycle: "monthly",
      currentPeriodEnd: "2026-08-15T00:00:00.000Z",
      amountCents: 500000,
      currency: "XOF",
      planName: "Essentiel",
    },
  ],
  invoices: [
    {
      id: "inv_1",
      invoiceNumber: "INV-2026-0042",
      status: "overdue",
      studentName: "Awa Diop",
      dueDate: "2026-07-01",
      totalCents: 500000,
      balanceCents: 500000,
      paidCents: 0,
      currency: "XOF",
    },
  ],
};

function setup(overrides: Partial<BillingSnapshot> = {}) {
  const onCreatePlan = vi.fn();
  const onEditPlan = vi.fn();
  const data: BillingSnapshot = { ...snapshot, ...overrides };

  render(
    <BillingWorkspace data={data} onCreatePlan={onCreatePlan} onEditPlan={onEditPlan} />,
  );

  return { onCreatePlan, onEditPlan };
}

describe("BillingWorkspace", () => {
  it("affiche les plans avec le montant et le statut formatés", () => {
    setup();

    expect(screen.getByText("Essentiel")).toBeInTheDocument();
    expect(screen.getByText("Actif")).toBeInTheDocument();
    expect(screen.getByText("Inactif")).toBeInTheDocument();
    // formatMoney(500000, "XOF") => "5 000 XOF" (0 décimale pour le XOF)
    expect(screen.getByText(/5\s*000\s*XOF/)).toBeInTheDocument();
  });

  it("déclenche onCreatePlan au clic sur « Nouveau plan »", async () => {
    const user = userEvent.setup();
    const { onCreatePlan } = setup();

    await user.click(screen.getByRole("button", { name: /nouveau plan/i }));

    expect(onCreatePlan).toHaveBeenCalledTimes(1);
  });

  it("déclenche onEditPlan avec le bon plan au clic sur une carte", async () => {
    const user = userEvent.setup();
    const { onEditPlan } = setup();

    await user.click(screen.getByText("Essentiel"));

    expect(onEditPlan).toHaveBeenCalledTimes(1);
    const editedPlan = onEditPlan.mock.calls[0][0] as PlanRecord;
    expect(editedPlan.id).toBe("plan_essentiel");
  });

  it("affiche les abonnements avec le badge de statut correspondant", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("tab", { name: /abonnements/i }));

    expect(screen.getByText("École Les Flamboyants")).toBeInTheDocument();
    expect(screen.getByText("past_due")).toBeInTheDocument();
  });

  it("affiche les factures dans un tableau avec le statut « overdue »", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("tab", { name: /factures/i }));

    const row = screen.getByText("INV-2026-0042").closest("tr");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText("overdue")).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText("Awa Diop")).toBeInTheDocument();
  });

  it("ne plante pas quand data est absent (aucune facture/plan chargé)", () => {
    const onCreatePlan = vi.fn();
    const onEditPlan = vi.fn();

    render(<BillingWorkspace onCreatePlan={onCreatePlan} onEditPlan={onEditPlan} />);

    // Aucun plan à afficher, mais le bouton d'action reste utilisable.
    expect(screen.getByRole("button", { name: /nouveau plan/i })).toBeInTheDocument();
  });
});
