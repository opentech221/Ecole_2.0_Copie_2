import { describe, expect, it } from "vitest";
import { parseCsv } from "./csvImport";

describe("parseCsv", () => {
  it("parses semicolon-separated rows and normalizes values", () => {
    const csv = [
      "Matricule;Nom;Prénom;Genre;Date de naissance;Lieu de naissance;Tuteur;Téléphone",
      "A001;Durand;Paul;M;12/03/2014;Lyon;Mme Durand;0610203040",
      "A002;Martin;Claire;f;14/07/2015;Marseille;;",
    ].join("\n");

    const result = parseCsv(csv);

    expect(result.valid).toHaveLength(2);
    expect(result.valid[0]).toMatchObject({
      matricule: "A001",
      nom: "DURAND",
      prenom: "Paul",
      genre: "M",
      dateNaissance: "2014-03-12",
      lieuNaissance: "Lyon",
      tuteurNom: "Mme Durand",
      tuteurPhone: "0610203040",
    });
    expect(result.valid[1].genre).toBe("F");
    expect(result.errors).toEqual([]);
  });

  it("reports missing required fields", () => {
    const csv = [
      "Nom;Prénom",
      "Durand;Paul",
      ";Claire",
    ].join("\n");

    const result = parseCsv(csv);

    expect(result.valid).toHaveLength(1);
    expect(result.detectedColumns).toEqual(["nom", "prenom"]);
    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([
      { row: 3, msg: "Ligne 3 : Nom manquant ou colonne Nom introuvable." },
    ]);
  });

  it("warns when required headers are missing", () => {
    const csv = [
      "Prénom;Genre",
      "Paul;M",
    ].join("\n");

    const result = parseCsv(csv);

    expect(result.missingRequiredColumns).toEqual(["Nom"]);
    expect(result.warnings).toContain("Colonnes obligatoires manquantes : Nom.");
    expect(result.errors).toEqual([
      { row: 2, msg: "Ligne 2 : Nom manquant ou colonne Nom introuvable." },
    ]);
  });
});
