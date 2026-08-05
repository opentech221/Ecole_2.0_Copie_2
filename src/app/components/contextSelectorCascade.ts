export interface ContextSelectorCascadeState {
  niveau: string;
  domaine: string;
  sousDomaine: string;
  discipline: string;
  palier: string;
  oaIdx: number | "";
  selectedOS: string;
}

export interface ContextSelectorCascadeOptions {
  availableNiveaux: string[];
  availableDomaines: string[];
  availableSousDomaines: string[];
  availableDisciplines: string[];
  availablePaliers: string[];
  availableOas: Array<{ oa: string; os: string[] }>;
  availableOs: string[];
}

export function normalizeContextSelectorCascade(
  state: ContextSelectorCascadeState,
  options: ContextSelectorCascadeOptions,
): ContextSelectorCascadeState {
  const next: ContextSelectorCascadeState = { ...state };

  if (!options.availableNiveaux.includes(state.niveau)) {
    return {
      ...next,
      domaine: "",
      sousDomaine: "",
      discipline: "",
      palier: "",
      oaIdx: "",
      selectedOS: "",
    };
  }

  if (!options.availableDomaines.includes(state.domaine)) {
    return {
      ...next,
      domaine: "",
      sousDomaine: "",
      discipline: "",
      palier: "",
      oaIdx: "",
      selectedOS: "",
    };
  }

  if (options.availableSousDomaines.length > 0 && !options.availableSousDomaines.includes(state.sousDomaine)) {
    next.sousDomaine = "";
  }

  if (options.availableDisciplines.length > 0 && !options.availableDisciplines.includes(state.discipline)) {
    next.discipline = "";
  }

  if (options.availablePaliers.length > 0 && !options.availablePaliers.includes(state.palier)) {
    next.palier = "";
  }

  if (next.palier === "") {
    next.oaIdx = "";
    next.selectedOS = "";
    return next;
  }

  if (typeof state.oaIdx !== "number" || state.oaIdx < 0 || state.oaIdx >= options.availableOas.length) {
    next.oaIdx = "";
    next.selectedOS = "";
    return next;
  }

  if (options.availableOs.length > 0 && !options.availableOs.includes(state.selectedOS)) {
    next.selectedOS = "";
  }

  return next;
}
