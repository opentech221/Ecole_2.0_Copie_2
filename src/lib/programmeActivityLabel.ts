function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeActivityLabel(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const CANONICAL_ACTIVITY_LABELS: Record<string, string> = {
  [normalizeActivityLabel("Activités Numériques")]: "Activités Numériques",
  [normalizeActivityLabel("Activités numériques")]: "Activités Numériques",
  [normalizeActivityLabel("Activités Géométriques")]: "Activités Géométriques",
  [normalizeActivityLabel("Activités géométriques")]: "Activités Géométriques",
  [normalizeActivityLabel("Sciences (IST)")]: "IST (Initiation Scientifique et Technologique)",
  [normalizeActivityLabel("IST (Initiation Scientifique et Technologique)")]: "IST (Initiation Scientifique et Technologique)",
  [normalizeActivityLabel("Éd. musicale")]: "Éducation Musicale",
  [normalizeActivityLabel("Éducation musicale")]: "Éducation Musicale",
  [normalizeActivityLabel("Éducation Musicale")]: "Éducation Musicale",
};

export function canonicalizeActivityLabel(value: string): string {
  const normalized = normalizeActivityLabel(value);
  return CANONICAL_ACTIVITY_LABELS[normalized] ?? value.trim();
}

export function resolveCatalogByActivity<T>(catalog: Record<string, T>, activityLabel: string): T | undefined {
  const canonical = canonicalizeActivityLabel(activityLabel);
  if (canonical in catalog) return catalog[canonical];

  const normalizedTarget = normalizeActivityLabel(canonical);
  for (const [key, value] of Object.entries(catalog)) {
    if (normalizeActivityLabel(key) === normalizedTarget) {
      return value;
    }
  }

  return undefined;
}
