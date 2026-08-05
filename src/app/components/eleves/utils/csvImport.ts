import type { NewStudentForm } from "../components/AddStudentModal";

const COL_MAP: Record<keyof NewStudentForm, string[]> = {
  matricule: ["matricule", "n° matricule", "numero", "id"],
  nom: ["nom", "name", "last name", "famille"],
  prenom: ["prénom", "prenom", "first name", "given name"],
  genre: ["genre", "sexe", "sex", "gender"],
  dateNaissance: ["date de naissance", "datenaissance", "date_naissance", "naissance", "birthday"],
  lieuNaissance: ["lieu de naissance", "lieunaissance", "lieu_naissance", "lieu"],
  tuteurNom: ["tuteur", "tuteur / parent", "tuteur_nom", "parent", "tuteurnom"],
  tuteurPhone: ["téléphone", "telephone", "tel", "phone", "tuteur_phone", "tuteurphone"],
};

export interface ParseResult {
  valid: NewStudentForm[];
  errors: { row: number; msg: string }[];
  warnings: string[];
  detectedColumns: string[];
  missingRequiredColumns: string[];
}

function normalizeHeader(h: string): keyof NewStudentForm | null {
  const clean = h.trim().toLowerCase();
  for (const [field, aliases] of Object.entries(COL_MAP)) {
    if (aliases.includes(clean)) return field as keyof NewStudentForm;
  }
  return null;
}

function normalizeDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) return trimmed;

  const frMatch = /^(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})$/.exec(trimmed);
  if (frMatch) {
    const [, day, month, year] = frMatch;
    return `${year}-${month}-${day}`;
  }

  return trimmed;
}

export function parseCsv(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return {
      valid: [],
      errors: [{ row: 0, msg: "Fichier vide ou sans données." }],
      warnings: [],
      detectedColumns: [],
      missingRequiredColumns: ["Nom", "Prénom"],
    };
  }

  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, ""));
  const mapping = headers.map(normalizeHeader);
  const detectedColumns = Array.from(new Set(mapping.filter(Boolean) as string[]));
  const warnings: string[] = [];
  const missingRequiredColumns = ["nom", "prenom"]
    .filter((field) => !mapping.includes(field as keyof NewStudentForm))
    .map((field) => (field === "nom" ? "Nom" : "Prénom"));

  const unmappedColumns = headers.filter((_, index) => mapping[index] === null);
  if (unmappedColumns.length > 0) {
    warnings.push(`Colonnes non reconnues ignorées : ${unmappedColumns.join(", ")}.`);
  }
  if (missingRequiredColumns.length > 0) {
    warnings.push(`Colonnes obligatoires manquantes : ${missingRequiredColumns.join(", ")}.`);
  }

  const valid: NewStudentForm[] = [];
  const errors: { row: number; msg: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    const row: Partial<NewStudentForm> = { genre: "M" };

    mapping.forEach((field, idx) => {
      if (field && cells[idx] !== undefined) {
        const val = cells[idx].trim();
        if (field === "genre") {
          row.genre = val.toUpperCase().startsWith("F") ? "F" : "M";
        } else {
          (row as Record<string, string>)[field] = val;
        }
      }
    });

    if (!row.nom?.trim()) {
      errors.push({ row: i + 1, msg: `Ligne ${i + 1} : Nom manquant ou colonne Nom introuvable.` });
      continue;
    }
    if (!row.prenom?.trim()) {
      errors.push({ row: i + 1, msg: `Ligne ${i + 1} : Prénom manquant ou colonne Prénom introuvable.` });
      continue;
    }

    valid.push({
      matricule: row.matricule ?? "",
      nom: row.nom.toUpperCase(),
      prenom: row.prenom,
      genre: row.genre ?? "M",
      dateNaissance: normalizeDate(row.dateNaissance ?? ""),
      lieuNaissance: row.lieuNaissance ?? "",
      tuteurNom: row.tuteurNom ?? "",
      tuteurPhone: row.tuteurPhone ?? "",
    });
  }

  return { valid, errors, warnings, detectedColumns, missingRequiredColumns };
}
