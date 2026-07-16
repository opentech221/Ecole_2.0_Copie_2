import { describe, expect, it } from "vitest";
import { priorityLabel, statusLabel } from "./services/notificationService";

describe("notificationService", () => {
  it("retourne les libellés de priorité en français", () => {
    expect(priorityLabel("critique")).toBe("Priorité critique");
    expect(priorityLabel("normale")).toBe("Priorité normale");
  });

  it("retourne les libellés d'état en français", () => {
    expect(statusLabel("non_lue")).toBe("Non lue");
    expect(statusLabel("archivee")).toBe("Archivée");
  });
});
