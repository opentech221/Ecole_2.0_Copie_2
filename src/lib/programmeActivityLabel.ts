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

const ACTIVITY_LOOKUP_ALIASES: Record<string, string[]> = {
  [normalizeActivityLabel("Grammaire")]: ["Production d'écrits"],
  [normalizeActivityLabel("Conjugaison")]: ["Production d'écrits"],
  [normalizeActivityLabel("Orthographe")]: ["Production d'écrits"],
  [normalizeActivityLabel("Vocabulaire")]: ["Production d'écrits"],
  [normalizeActivityLabel("EPS")]: ["Activités physiques et sportives"],
  [normalizeActivityLabel("Expression orale")]: ["Expression Orale", "Expression orale et récitation"],
};

export function canonicalizeActivityLabel(value: string): string {
  const normalized = normalizeActivityLabel(value);
  return CANONICAL_ACTIVITY_LABELS[normalized] ?? value.trim();
}

export function getActivityLookupCandidates(activityLabel: string): string[] {
  const canonical = canonicalizeActivityLabel(activityLabel);
  const normalizedCanonical = normalizeActivityLabel(canonical);
  const aliases = ACTIVITY_LOOKUP_ALIASES[normalizedCanonical] ?? [];

  const candidates = [canonical, ...aliases].map((value) => value.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];

  for (const candidate of candidates) {
    const key = normalizeActivityLabel(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
  }

  return out;
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
