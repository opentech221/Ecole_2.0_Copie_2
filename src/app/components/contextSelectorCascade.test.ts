import { describe, expect, it } from "vitest";
import { normalizeContextSelectorCascade } from "./contextSelectorCascade";

describe("normalizeContextSelectorCascade", () => {
  it("clears downstream selections when the selected domain is no longer valid", () => {
    const result = normalizeContextSelectorCascade(
      {
        niveau: "CP",
        domaine: "EPSA",
        sousDomaine: "Éducation Artistique",
        discipline: "Arts plastiques",
        palier: "Palier 2",
        oaIdx: 0,
        selectedOS: "OS1.1",
      },
      {
        availableNiveaux: ["CI", "CP"],
        availableDomaines: ["Langue et Communication", "Mathématiques"],
        availableSousDomaines: [],
        availableDisciplines: ["Lecture"],
        availablePaliers: ["Palier 1", "Palier 2"],
        availableOas: [{ oa: "OA1", os: ["OS1.1"] }],
        availableOs: ["OS1.1"],
      },
    );

    expect(result.domaine).toBe("");
    expect(result.sousDomaine).toBe("");
    expect(result.discipline).toBe("");
    expect(result.palier).toBe("");
    expect(result.oaIdx).toBe("");
    expect(result.selectedOS).toBe("");
  });

  it("clears the selected OS when it no longer belongs to the current OA", () => {
    const result = normalizeContextSelectorCascade(
      {
        niveau: "CP",
        domaine: "Langue et Communication",
        sousDomaine: "Communication Écrite",
        discipline: "Lecture",
        palier: "Palier 1",
        oaIdx: 0,
        selectedOS: "OS9.9",
      },
      {
        availableNiveaux: ["CI", "CP"],
        availableDomaines: ["Langue et Communication"],
        availableSousDomaines: ["Communication Écrite"],
        availableDisciplines: ["Lecture"],
        availablePaliers: ["Palier 1"],
        availableOas: [{ oa: "OA1", os: ["OS1.1"] }],
        availableOs: ["OS1.1"],
      },
    );

    expect(result.selectedOS).toBe("");
    expect(result.oaIdx).toBe(0);
  });
});
