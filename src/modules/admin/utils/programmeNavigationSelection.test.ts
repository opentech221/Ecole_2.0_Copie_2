import { describe, expect, it } from "vitest";
import { normalizeProgrammeNavigationSelection } from "./programmeNavigationSelection";

describe("normalizeProgrammeNavigationSelection", () => {
  it("falls back to all when the current selection is no longer valid", () => {
    const result = normalizeProgrammeNavigationSelection({
      filters: {
        niveaux: [{ id: "niveau-1", nom: "CP" }],
        domaines: [{ id: "domaine-1", niveau_id: "niveau-1", nom: "Mathématiques" }],
        sous_domaines: [{ id: "sous-1", domaine_id: "domaine-1", nom: "Nombres" }],
      },
      niveauId: "missing-level",
      domaineId: "missing-domain",
      sousDomaineId: "missing-subdomain",
    });

    expect(result).toEqual({
      niveauId: "all",
      domaineId: "all",
      sousDomaineId: "all",
    });
  });

  it("keeps the selected domain and subdomain when they still belong to the chosen niveau", () => {
    const result = normalizeProgrammeNavigationSelection({
      filters: {
        niveaux: [{ id: "niveau-1", nom: "CP" }],
        domaines: [
          { id: "domaine-1", niveau_id: "niveau-1", nom: "Mathématiques" },
          { id: "domaine-2", niveau_id: "niveau-2", nom: "Langue" },
        ],
        sous_domaines: [
          { id: "sous-1", domaine_id: "domaine-1", nom: "Nombres" },
          { id: "sous-2", domaine_id: "domaine-2", nom: "Lecture" },
        ],
      },
      niveauId: "niveau-1",
      domaineId: "domaine-1",
      sousDomaineId: "sous-1",
    });

    expect(result).toEqual({
      niveauId: "niveau-1",
      domaineId: "domaine-1",
      sousDomaineId: "sous-1",
    });
  });
});
