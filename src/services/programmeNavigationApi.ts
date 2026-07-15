import { supabase } from "../lib/supabase";

export type ProgrammeNiveau = {
  id: string;
  nom: string;
  domaines_count: number;
  activites_count: number;
};

export type ProgrammeDomaine = {
  id: string;
  niveau_id: string;
  nom: string;
  sous_domaines_count: number;
  activites_count: number;
};

export type ProgrammeSousDomaine = {
  id: string;
  domaine_id: string;
  nom: string | null;
  activites_count: number;
};

export type ProgrammeActivite = {
  id: string;
  sous_domaine_id: string;
  nom: string;
  page_source: number | null;
  document_ref: string | null;
  competences_count: number;
};

export type ProgrammeNavigationRow = {
  niveau_id: string;
  niveau_nom: string;
  domaine_id: string;
  domaine_nom: string;
  sous_domaine_id: string;
  sous_domaine_nom: string | null;
  activite_id: string;
  activite_nom: string;
  page_source: number | null;
  document_ref: string | null;
  competences_count: number;
  paliers_count: number;
  oa_count: number;
  os_count: number;
  contenus_count: number;
};

async function unwrapRpc<T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const programmeNavigationApi = {
  async getNiveaux(): Promise<ProgrammeNiveau[]> {
    return unwrapRpc<ProgrammeNiveau[]>(supabase.rpc("programme_get_niveaux"));
  },

  async getDomaines(niveauId: string): Promise<ProgrammeDomaine[]> {
    return unwrapRpc<ProgrammeDomaine[]>(
      supabase.rpc("programme_get_domaines", { p_niveau_id: niveauId }),
    );
  },

  async getSousDomaines(domaineId: string): Promise<ProgrammeSousDomaine[]> {
    return unwrapRpc<ProgrammeSousDomaine[]>(
      supabase.rpc("programme_get_sous_domaines", { p_domaine_id: domaineId }),
    );
  },

  async getActivites(sousDomaineId: string): Promise<ProgrammeActivite[]> {
    return unwrapRpc<ProgrammeActivite[]>(
      supabase.rpc("programme_get_activites", { p_sous_domaine_id: sousDomaineId }),
    );
  },

  async search(query: string, limit = 50): Promise<ProgrammeNavigationRow[]> {
    return unwrapRpc<ProgrammeNavigationRow[]>(
      supabase.rpc("programme_search_navigation", {
        p_query: query,
        p_limit: limit,
      }),
    );
  },

  async browseFlat(params?: {
    niveauId?: string;
    domaineId?: string;
    sousDomaineId?: string;
    limit?: number;
  }): Promise<ProgrammeNavigationRow[]> {
    let q = supabase
      .from("programme_navigation_v")
      .select("*")
      .order("niveau_nom", { ascending: true })
      .order("domaine_nom", { ascending: true })
      .order("activite_nom", { ascending: true });

    if (params?.niveauId) q = q.eq("niveau_id", params.niveauId);
    if (params?.domaineId) q = q.eq("domaine_id", params.domaineId);
    if (params?.sousDomaineId) q = q.eq("sous_domaine_id", params.sousDomaineId);
    if (params?.limit) q = q.limit(params.limit);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as ProgrammeNavigationRow[];
  },
};
