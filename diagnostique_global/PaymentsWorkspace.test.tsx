import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PaymentsWorkspace } from "./PaymentsWorkspace";
import type { PaymentFilters, PaymentsPageResult } from "../types";

const baseFilters: PaymentFilters = {
  page: 1,
  pageSize: 10,
  search: "",
  status: "all",
  paymentMethod: "all",
  reconciliationStatus: "all",
};

const pageResult: PaymentsPageResult = {
  page: 1,
  pageSize: 10,
  total: 2,
  rows: [
    {
      id: "pay_1",
      tenantId: "tenant_1",
      tenantName: "École Les Flamboyants",
      studentId: "stu_1",
      studentName: "Awa Diop",
      parentName: "Moussa Diop",
      parentEmail: "moussa@example.com",
      classId: "CE1",
      invoiceId: "inv_1",
      invoiceNumber: "INV-2026-0042",
      subscriptionId: null,
      amountCents: 500000,
      currency: "XOF",
      status: "paid",
      paymentMethod: "mobile_money",
      provider: "wave",
      reconciliationStatus: "matched",
      createdAt: "2026-07-01T10:00:00.000Z",
      paidAt: "2026-07-01T10:05:00.000Z",
      failureReason: null,
    },
    {
      id: "pay_2",
      tenantId: "tenant_1",
      tenantName: "École Les Flamboyants",
      studentId: "stu_2",
      studentName: "Ibrahima Ndiaye",
      parentName: null,
      parentEmail: null,
      classId: "CM2",
      invoiceId: null,
      invoiceNumber: null,
      subscriptionId: null,
      amountCents: 250000,
      currency: "XOF",
      status: "failed",
      paymentMethod: "card",
      provider: "stripe",
      reconciliationStatus: "unmatched",
      createdAt: "2026-07-02T08:30:00.000Z",
      paidAt: null,
      failureReason: "insufficient_funds",
    },
  ],
};

const statusCounts = {
  paid: 12,
  pending: 3,
  failed: 1,
  refunded: 0,
  partially_refunded: 0,
  disputed: 0,
};

function setup(overrides: {
  filters?: Partial<PaymentFilters>;
  data?: PaymentsPageResult;
  loading?: boolean;
} = {}) {
  const setFilters = vi.fn();
  const onOpenPayment = vi.fn();
  const onExport = vi.fn();
  const filters = { ...baseFilters, ...overrides.filters };

  const utils = render(
    <PaymentsWorkspace
      filters={filters}
      setFilters={setFilters}
      data={overrides.data ?? pageResult}
      loading={overrides.loading ?? false}
      statusCounts={statusCounts}
      onOpenPayment={onOpenPayment}
      onExport={onExport}
    />,
  );

  return { setFilters, onOpenPayment, onExport, filters, ...utils };
}

describe("PaymentsWorkspace", () => {
  it("affiche les compteurs de statut dans l'onglet Synthèse (par défaut)", () => {
    setup();

    expect(screen.getByText("12")).toBeInTheDocument(); // paid
    expect(screen.getByText("3")).toBeInTheDocument(); // pending
  });

  it("déclenche setFilters avec le texte saisi dans la recherche", async () => {
    const user = userEvent.setup();
    const { setFilters } = setup();

    await user.click(screen.getByRole("tab", { name: /filtres/i }));
    await user.type(screen.getByPlaceholderText(/élève, parent, email/i), "Awa");

    expect(setFilters).toHaveBeenCalled();
    // On vérifie la forme de l'updater plutôt qu'un unique appel,
    // userEvent.type déclenche onChange caractère par caractère.
    const lastCallUpdater = setFilters.mock.calls.at(-1)?.[0];
    expect(typeof lastCallUpdater).toBe("function");
    expect(lastCallUpdater(baseFilters)).toMatchObject({ page: 1 });
  });

  it("réinitialise les filtres au clic sur « Réinitialiser »", async () => {
    const user = userEvent.setup();
    const { setFilters } = setup({ filters: { search: "Awa", status: "paid" } });

    await user.click(screen.getByRole("tab", { name: /filtres/i }));
    await user.click(screen.getByRole("button", { name: /réinitialiser/i }));

    expect(setFilters).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, search: "", status: "all", paymentMethod: "all", reconciliationStatus: "all" }),
    );
  });

  it("déclenche onExport au clic sur « Export CSV »", async () => {
    const user = userEvent.setup();
    const { onExport } = setup();

    await user.click(screen.getByRole("tab", { name: /filtres/i }));
    await user.click(screen.getByRole("button", { name: /export csv/i }));

    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("liste les transactions et ouvre le détail du bon paiement", async () => {
    const user = userEvent.setup();
    const { onOpenPayment } = setup();

    await user.click(screen.getByRole("tab", { name: /transactions/i }));

    expect(screen.getByText("Awa Diop")).toBeInTheDocument();
    expect(screen.getByText("Ibrahima Ndiaye")).toBeInTheDocument();

    const rows = screen.getAllByRole("row").filter((row) => row.textContent?.includes("Awa Diop"));
    const detailButton = within(rows[0]).getByRole("button", { name: /détail/i });
    await user.click(detailButton);

    expect(onOpenPayment).toHaveBeenCalledWith("pay_1");
  });

  it("affiche un message quand aucune transaction ne correspond au filtre", async () => {
    const user = userEvent.setup();
    setup({ data: { page: 1, pageSize: 10, total: 0, rows: [] } });

    await user.click(screen.getByRole("tab", { name: /transactions/i }));

    expect(screen.getByText(/aucune transaction sur ce filtre/i)).toBeInTheDocument();
  });

  it("désactive « Précédent » et « Suivant » quand la page n'est pas pleine (page 1, 2 lignes < pageSize 10)", async () => {
    const user = userEvent.setup();
    setup({
      filters: { page: 1 },
      data: { page: 1, pageSize: 10, total: 2, rows: pageResult.rows },
    });

    await user.click(screen.getByRole("tab", { name: /transactions/i }));

    expect(screen.getByRole("button", { name: /précédent/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /suivant/i })).toBeDisabled();
  });

  it("active « Suivant » et avance la page quand la page est pleine", async () => {
    const user = userEvent.setup();
    const fullPageRows = Array.from({ length: 10 }, (_, i) => ({
      ...pageResult.rows[0],
      id: `pay_full_${i}`,
    }));
    const { setFilters } = setup({
      filters: { page: 1, pageSize: 10 },
      data: { page: 1, pageSize: 10, total: 25, rows: fullPageRows },
    });

    await user.click(screen.getByRole("tab", { name: /transactions/i }));

    const nextButton = screen.getByRole("button", { name: /suivant/i });
    expect(nextButton).toBeEnabled();

    await user.click(nextButton);

    expect(setFilters).toHaveBeenCalled();
    const updater = setFilters.mock.calls.at(-1)?.[0];
    expect(typeof updater).toBe("function");
    expect(updater({ ...baseFilters, page: 1 })).toMatchObject({ page: 2 });
  });
});

// Note : les filtres "Statut", "Canal" et "Rapprochement" utilisent Radix Select,
// dont l'ouverture du menu nécessite des polyfills jsdom supplémentaires
// (scrollIntoView, ResizeObserver, hasPointerCapture). Non couvert ici —
// voir le ticket "Compléter la couverture de test sur les filtres Select".
