import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router";
import { Dashboard } from "@/app/components/Dashboard";

const navigateMock = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/app/contexts/AppContext", () => ({
  useAppContext: () => ({
    activeClass: "CM2",
    role: "director",
    userName: "Awa Diop",
    schoolName: "École de la Paix",
  }),
}));

vi.mock("@/app/contexts/AuthContext", () => ({
  useAuthContext: () => ({
    profile: {
      fullName: "Awa Diop",
      logoUrl: "",
      role: "director",
    },
  }),
}));

describe("Dashboard admin module", () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("renders the Admin SaaS module and navigates to its dedicated page", async () => {
    const user = userEvent.setup();

    render(
      createElement(MemoryRouter, null, createElement(Dashboard))
    );

    const moduleButton = screen.getByRole("button", { name: /Admin SaaS/i });
    expect(moduleButton).toBeInTheDocument();

    await user.click(moduleButton);

    expect(navigateMock).toHaveBeenCalledWith("/admin/saas");
  });
});
