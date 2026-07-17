import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CahierRoulementScreen } from "../../src/app/components/CahierRoulementScreen";

vi.mock("../../src/app/contexts/AppContext", () => ({
  useAppContext: () => ({
    activeClass: "CE2",
  }),
}));

vi.mock("../../src/lib/supabase", () => {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    TABLES: {
      documents: "documents",
    },
    supabase: {
      from: vi.fn(() => query),
    },
  };
});

describe("CahierRoulementScreen journal view", () => {
  function createTestQueryClient() {
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  }

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the weekly journal structure and stores observations", async () => {
    const queryClient = createTestQueryClient();

    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <CahierRoulementScreen />
          </MemoryRouter>
        </QueryClientProvider>
      );
    });

    expect(screen.getByText(/cahier de journal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/semaine du/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mathématiques/i).length).toBeGreaterThan(0);

    const observations = screen.getByLabelText(/observations.*lundi/i);
    await act(async () => {
      fireEvent.change(observations, { target: { value: "Ras" } });
    });

    await waitFor(() => {
      expect(observations).toHaveValue("Ras");
    });
  });
});
