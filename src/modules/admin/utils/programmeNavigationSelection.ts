import type { ProgrammeFilters } from "@/services/programmeNavFunctionApi";

export type ProgrammeNavigationSelection = {
  niveauId: string;
  domaineId: string;
  sousDomaineId: string;
};

export function normalizeProgrammeNavigationSelection({
  filters,
  niveauId,
  domaineId,
  sousDomaineId,
}: {
  filters: ProgrammeFilters | undefined;
  niveauId: string;
  domaineId: string;
  sousDomaineId: string;
}): ProgrammeNavigationSelection {
  if (!filters) {
    return { niveauId, domaineId, sousDomaineId };
  }

  const nextNiveauId = filters.niveaux.some((item) => item.id === niveauId) ? niveauId : "all";
  const nextDomaineId =
    nextNiveauId === "all"
      ? (filters.domaines.some((item) => item.id === domaineId) ? domaineId : "all")
      : filters.domaines.some((item) => item.id === domaineId && item.niveau_id === nextNiveauId)
        ? domaineId
        : "all";
  const nextSousDomaineId =
    nextDomaineId === "all"
      ? (filters.sous_domaines.some((item) => item.id === sousDomaineId) ? sousDomaineId : "all")
      : filters.sous_domaines.some((item) => item.id === sousDomaineId && item.domaine_id === nextDomaineId)
        ? sousDomaineId
        : "all";

  return {
    niveauId: nextNiveauId,
    domaineId: nextDomaineId,
    sousDomaineId: nextSousDomaineId,
  };
}
