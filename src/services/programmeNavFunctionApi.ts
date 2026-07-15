import { supabase } from "../lib/supabase";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { getActivityLookupCandidates } from "../lib/programmeActivityLabel";
import type {
  ProgrammeNavigationRow,
} from "./programmeNavigationApi";

export type ProgrammeTreeActivite = {
  id: string;
  nom: string;
  page_source: number | null;
  document_ref: string | null;
  counts: {
    competences: number;
    paliers: number;
    objectifs_apprentissage: number;
    objectifs_specifiques: number;
    contenus: number;
  };
};

export type ProgrammeTreeSousDomaine = {
  id: string;
  nom: string | null;
  activites: ProgrammeTreeActivite[];
};

export type ProgrammeTreeDomaine = {
  id: string;
  nom: string;
  sous_domaines: ProgrammeTreeSousDomaine[];
};

export type ProgrammeTreeNiveau = {
  id: string;
  nom: string;
  domaines: ProgrammeTreeDomaine[];
};

export type ProgrammeFilters = {
  niveaux: Array<{ id: string; nom: string }>;
  domaines: Array<{ id: string; niveau_id: string; nom: string }>;
  sous_domaines: Array<{ id: string; domaine_id: string; nom: string | null }>;
};

export type ProgrammeCurriculumDetail = {
  activite: string;
  competence: string;
  paliers: Array<{
    id: string;
    nom: string;
    description: string | null;
    oas: Array<{
      id: string;
      titre: string;
      os: Array<{
        id: string;
        titre: string;
        contenus: string[];
      }>;
    }>;
  }>;
};

export type ProgrammeFlatMeta = {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  hasNext: boolean;
  hasPrev: boolean;
};

const fnBaseUrl = `https://${projectId}.supabase.co/functions/v1/programme-nav`;

type QueryParams = Record<string, string | number | undefined | null>;

function buildUrl(path: string, params?: QueryParams) {
  const url = new URL(`${fnBaseUrl}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function getAuthHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? publicAnonKey;
  return {
    Authorization: `Bearer ${token}`,
    apikey: publicAnonKey,
  };
}

async function getJson<T>(path: string, params?: QueryParams): Promise<T> {
  const headers = await getAuthHeader();
  const res = await fetch(buildUrl(path, params), {
    method: "GET",
    headers,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as { error?: string }).error ?? `HTTP ${res.status}`;
    throw new Error(message);
  }

  return json as T;
}

export const programmeNavFunctionApi = {
  getTree(params?: {
    niveauId?: string;
    domaineId?: string;
    sousDomaineId?: string;
    search?: string;
    limit?: number;
  }) {
    return getJson<{ data: ProgrammeTreeNiveau[]; meta: unknown }>("/tree", params);
  },

  getFlat(params?: {
    niveauId?: string;
    domaineId?: string;
    sousDomaineId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return getJson<{ data: ProgrammeNavigationRow[]; meta: ProgrammeFlatMeta }>("/flat", params);
  },

  search(query: string, limit = 50) {
    return getJson<{ data: ProgrammeNavigationRow[]; meta: unknown }>("/search", {
      q: query,
      limit,
    });
  },

  getFilters(params?: { niveauId?: string; domaineId?: string }) {
    return getJson<{ data: ProgrammeFilters }>("/filters", params);
  },

  getCurriculum(params?: {
    niveauId?: string;
    domaineId?: string;
    sousDomaineId?: string;
    activite?: string;
  }) {
    return getJson<{ data: { disciplines: string[]; detail: ProgrammeCurriculumDetail | null } }>("/curriculum", params);
  },

  async getCurriculumResolved(params?: {
    niveauId?: string;
    domaineId?: string;
    sousDomaineId?: string;
    activite?: string;
  }) {
    if (!params?.activite) {
      return getJson<{ data: { disciplines: string[]; detail: ProgrammeCurriculumDetail | null } }>("/curriculum", params);
    }

    const candidates = getActivityLookupCandidates(params.activite);
    let lastResponse: { data: { disciplines: string[]; detail: ProgrammeCurriculumDetail | null } } | null = null;

    for (const candidate of candidates) {
      const response = await getJson<{ data: { disciplines: string[]; detail: ProgrammeCurriculumDetail | null } }>("/curriculum", {
        ...params,
        activite: candidate,
      });

      lastResponse = response;
      if (response.data.detail?.paliers?.length) {
        return response;
      }
    }

    return lastResponse ?? getJson<{ data: { disciplines: string[]; detail: ProgrammeCurriculumDetail | null } }>("/curriculum", params);
  },
};
