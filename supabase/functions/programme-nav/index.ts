import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

type NavRow = {
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

const app = new Hono();
app.use("*", logger(console.log));

const defaultOrigins = ["*.github.dev", "*.vercel.app", "http://localhost:5173"];
const rawOrigins = Deno.env.get("ALLOWED_ORIGINS") ?? defaultOrigins.join(",");
const ALLOWED_ORIGIN_PATTERNS = rawOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isOriginAllowed(origin: string): boolean {
  if (!origin) return true;

  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => {
    if (pattern === "*" || pattern === origin) return true;

    if (pattern.startsWith("*.")) {
      try {
        const hostname = new URL(origin).hostname;
        const suffix = pattern.slice(2);
        return hostname === suffix || hostname.endsWith(`.${suffix}`);
      } catch {
        return false;
      }
    }

    return false;
  });
}

app.use(
  "/*",
  cors({
    origin: (origin) => (isOriginAllowed(origin) ? origin : false),
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
    allowMethods: ["GET", "OPTIONS"],
    maxAge: 600,
  }),
);

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY for programme-nav function");
}

function getClient(authHeader?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader ?? `Bearer ${supabaseAnonKey}`,
      },
    },
  });
}

function registerGet(path: string, handler: Parameters<typeof app.get>[1]) {
  app.get(path, handler);
  app.get(`/programme-nav${path}`, handler);
}

function parsePositiveInt(value: string | undefined, fallback: number, max = 1000) {
  const n = Number(value ?? "");
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.trunc(n), max);
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function applyFilters(
  query: any,
  params: {
    niveauId?: string;
    domaineId?: string;
    sousDomaineId?: string;
  },
) {
  let q = query;

  if (params.niveauId) q = q.eq("niveau_id", params.niveauId);
  if (params.domaineId) q = q.eq("domaine_id", params.domaineId);
  if (params.sousDomaineId) q = q.eq("sous_domaine_id", params.sousDomaineId);

  return q;
}

function buildTree(rows: NavRow[]) {
  const niveaux = new Map<string, {
    id: string;
    nom: string;
    domaines: Map<string, {
      id: string;
      nom: string;
      sous_domaines: Map<string, {
        id: string;
        nom: string | null;
        activites: Array<{
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
        }>;
      }>;
    }>;
  }>();

  for (const row of rows) {
    if (!niveaux.has(row.niveau_id)) {
      niveaux.set(row.niveau_id, {
        id: row.niveau_id,
        nom: row.niveau_nom,
        domaines: new Map(),
      });
    }

    const niveau = niveaux.get(row.niveau_id)!;

    if (!niveau.domaines.has(row.domaine_id)) {
      niveau.domaines.set(row.domaine_id, {
        id: row.domaine_id,
        nom: row.domaine_nom,
        sous_domaines: new Map(),
      });
    }

    const domaine = niveau.domaines.get(row.domaine_id)!;

    if (!domaine.sous_domaines.has(row.sous_domaine_id)) {
      domaine.sous_domaines.set(row.sous_domaine_id, {
        id: row.sous_domaine_id,
        nom: row.sous_domaine_nom,
        activites: [],
      });
    }

    const sousDomaine = domaine.sous_domaines.get(row.sous_domaine_id)!;
    sousDomaine.activites.push({
      id: row.activite_id,
      nom: row.activite_nom,
      page_source: row.page_source,
      document_ref: row.document_ref,
      counts: {
        competences: row.competences_count,
        paliers: row.paliers_count,
        objectifs_apprentissage: row.oa_count,
        objectifs_specifiques: row.os_count,
        contenus: row.contenus_count,
      },
    });
  }

  return Array.from(niveaux.values()).map((niveau) => ({
    id: niveau.id,
    nom: niveau.nom,
    domaines: Array.from(niveau.domaines.values()).map((domaine) => ({
      id: domaine.id,
      nom: domaine.nom,
      sous_domaines: Array.from(domaine.sous_domaines.values()),
    })),
  }));
}

registerGet("/health", (c) => c.json({ status: "ok" }));

registerGet("/flat", async (c) => {
  const client = getClient(c.req.header("Authorization"));
  const pageSize = parsePositiveInt(c.req.query("limit"), 20, 200);
  const page = parsePositiveInt(c.req.query("page"), 1, 100000);
  const search = normalizeText(c.req.query("search") ?? undefined);
  const offset = (page - 1) * pageSize;

  const baseQuery = applyFilters(
    client
      .from("programme_navigation_v")
      .select("*", { count: "exact" })
      .order("niveau_nom", { ascending: true })
      .order("domaine_nom", { ascending: true })
      .order("sous_domaine_nom", { ascending: true, nullsFirst: false })
      .order("activite_nom", { ascending: true }),
    {
      niveauId: c.req.query("niveauId") ?? undefined,
      domaineId: c.req.query("domaineId") ?? undefined,
      sousDomaineId: c.req.query("sousDomaineId") ?? undefined,
    },
  );

  if (!search) {
    const { data, count, error } = await baseQuery.range(offset, offset + pageSize - 1);
    if (error) return c.json({ error: error.message }, 400);

    const total = count ?? 0;
    const pageCount = Math.max(Math.ceil(total / pageSize), 1);

    return c.json({
      data: data ?? [],
      meta: {
        total,
        page,
        pageSize,
        pageCount,
        hasPrev: page > 1,
        hasNext: page < pageCount,
      },
    });
  }

  const { data, error } = await baseQuery.limit(5000);
  if (error) return c.json({ error: error.message }, 400);

  const filteredRows = ((data ?? []) as NavRow[]).filter((row) => {
    const haystack = [row.niveau_nom, row.domaine_nom, row.sous_domaine_nom, row.activite_nom]
      .map((value) => normalizeText(value))
      .join(" ");
    return haystack.includes(search);
  });

  const total = filteredRows.length;
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);
  const paged = filteredRows.slice(offset, offset + pageSize);

  return c.json({
    data: paged,
    meta: {
      total,
      page,
      pageSize,
      pageCount,
      hasPrev: page > 1,
      hasNext: page < pageCount,
    },
  });
});

registerGet("/search", async (c) => {
  const client = getClient(c.req.header("Authorization"));
  const q = (c.req.query("q") ?? "").trim();
  const limit = parsePositiveInt(c.req.query("limit"), 50, 300);

  const { data, error } = await client.rpc("programme_search_navigation", {
    p_query: q,
    p_limit: limit,
  });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data: data ?? [], meta: { q, limit } });
});

registerGet("/tree", async (c) => {
  const client = getClient(c.req.header("Authorization"));
  const limit = parsePositiveInt(c.req.query("limit"), 1000, 3000);

  const filtered = applyFilters(
    client
      .from("programme_navigation_v")
      .select("*")
      .order("niveau_nom", { ascending: true })
      .order("domaine_nom", { ascending: true })
      .order("sous_domaine_nom", { ascending: true, nullsFirst: false })
      .order("activite_nom", { ascending: true }),
    {
      niveauId: c.req.query("niveauId") ?? undefined,
      domaineId: c.req.query("domaineId") ?? undefined,
      sousDomaineId: c.req.query("sousDomaineId") ?? undefined,
    },
  ).limit(limit);

  const { data, error } = await filtered;
  if (error) return c.json({ error: error.message }, 400);

  const rows = (data ?? []) as NavRow[];
  const tree = buildTree(rows);

  return c.json({
    data: tree,
    meta: {
      nodes: {
        niveaux: tree.length,
        domaines: tree.reduce((acc, n) => acc + n.domaines.length, 0),
        sous_domaines: tree.reduce(
          (acc, n) => acc + n.domaines.reduce((a, d) => a + d.sous_domaines.length, 0),
          0,
        ),
        activites: rows.length,
      },
      limit,
    },
  });
});

registerGet("/filters", async (c) => {
  const client = getClient(c.req.header("Authorization"));
  const niveauId = c.req.query("niveauId") ?? undefined;
  const domaineId = c.req.query("domaineId") ?? undefined;

  const niveauxQ = client.from("niveaux").select("id, nom").order("nom", { ascending: true });
  const domainesQ = (niveauId
    ? client.from("domaines").select("id, niveau_id, nom").eq("niveau_id", niveauId)
    : client.from("domaines").select("id, niveau_id, nom")
  ).order("nom", { ascending: true });

  const sousDomainesQ = (domaineId
    ? client.from("sous_domaines").select("id, domaine_id, nom").eq("domaine_id", domaineId)
    : client.from("sous_domaines").select("id, domaine_id, nom")
  ).order("nom", { ascending: true, nullsFirst: false });

  const [niveauxRes, domainesRes, sousDomainesRes] = await Promise.all([
    niveauxQ,
    domainesQ,
    sousDomainesQ,
  ]);

  if (niveauxRes.error) return c.json({ error: niveauxRes.error.message }, 400);
  if (domainesRes.error) return c.json({ error: domainesRes.error.message }, 400);
  if (sousDomainesRes.error) return c.json({ error: sousDomainesRes.error.message }, 400);

  return c.json({
    data: {
      niveaux: niveauxRes.data ?? [],
      domaines: domainesRes.data ?? [],
      sous_domaines: sousDomainesRes.data ?? [],
    },
  });
});

registerGet("/curriculum", async (c) => {
  const client = getClient(c.req.header("Authorization"));
  const niveauId = c.req.query("niveauId") ?? undefined;
  const domaineId = c.req.query("domaineId") ?? undefined;
  const sousDomaineId = c.req.query("sousDomaineId") ?? undefined;
  const activiteNom = (c.req.query("activite") ?? "").trim();

  const navRes = await applyFilters(
    client
      .from("programme_navigation_v")
      .select("activite_id, activite_nom")
      .order("activite_nom", { ascending: true }),
    { niveauId, domaineId, sousDomaineId },
  ).limit(5000);

  if (navRes.error) return c.json({ error: navRes.error.message }, 400);

  const navRows = (navRes.data ?? []) as Array<{ activite_id: string; activite_nom: string }>;

  const disciplineSet = new Set<string>();
  for (const row of navRows) disciplineSet.add(row.activite_nom);
  const disciplines = Array.from(disciplineSet.values()).sort((a, b) => a.localeCompare(b, "fr"));

  if (!activiteNom) {
    return c.json({ data: { disciplines, detail: null } });
  }

  const activiteIds = navRows
    .filter((row) => row.activite_nom === activiteNom)
    .map((row) => row.activite_id);

  if (activiteIds.length === 0) {
    return c.json({ data: { disciplines, detail: null } });
  }

  const cbRes = await client
    .from("competences_base")
    .select("id, activite_id, description")
    .in("activite_id", activiteIds);
  if (cbRes.error) return c.json({ error: cbRes.error.message }, 400);

  const competences = cbRes.data ?? [];
  const competenceIds = competences.map((c) => c.id);

  if (competenceIds.length === 0) {
    return c.json({
      data: {
        disciplines,
        detail: {
          activite: activiteNom,
          competence: "",
          paliers: [],
        },
      },
    });
  }

  const paliersRes = await client
    .from("paliers")
    .select("id, competence_id, nom, description")
    .in("competence_id", competenceIds)
    .order("nom", { ascending: true });
  if (paliersRes.error) return c.json({ error: paliersRes.error.message }, 400);

  const paliers = paliersRes.data ?? [];
  const palierIds = paliers.map((p) => p.id);

  const oaRes = palierIds.length
    ? await client
      .from("objectifs_apprentissage")
      .select("id, palier_id, titre")
      .in("palier_id", palierIds)
      .order("titre", { ascending: true })
    : { data: [], error: null };
  if (oaRes.error) return c.json({ error: oaRes.error.message }, 400);

  const oas = oaRes.data ?? [];
  const oaIds = oas.map((oa) => oa.id);

  const osRes = oaIds.length
    ? await client
      .from("objectifs_specifiques")
      .select("id, oa_id, titre")
      .in("oa_id", oaIds)
      .order("titre", { ascending: true })
    : { data: [], error: null };
  if (osRes.error) return c.json({ error: osRes.error.message }, 400);

  const oss = osRes.data ?? [];
  const osIds = oss.map((os) => os.id);

  const contenusRes = osIds.length
    ? await client
      .from("contenus")
      .select("id, os_id, libelle")
      .in("os_id", osIds)
      .order("libelle", { ascending: true })
    : { data: [], error: null };
  if (contenusRes.error) return c.json({ error: contenusRes.error.message }, 400);

  const contenus = contenusRes.data ?? [];

  const contenuByOs = new Map<string, string[]>();
  for (const ctn of contenus) {
    if (!contenuByOs.has(ctn.os_id)) contenuByOs.set(ctn.os_id, []);
    contenuByOs.get(ctn.os_id)!.push(ctn.libelle);
  }

  const osByOa = new Map<string, Array<{ id: string; titre: string; contenus: string[] }>>();
  for (const os of oss) {
    if (!osByOa.has(os.oa_id)) osByOa.set(os.oa_id, []);
    osByOa.get(os.oa_id)!.push({
      id: os.id,
      titre: os.titre,
      contenus: contenuByOs.get(os.id) ?? [],
    });
  }

  const oaByPalier = new Map<string, Array<{ id: string; titre: string; os: Array<{ id: string; titre: string; contenus: string[] }> }>>();
  for (const oa of oas) {
    if (!oaByPalier.has(oa.palier_id)) oaByPalier.set(oa.palier_id, []);
    oaByPalier.get(oa.palier_id)!.push({
      id: oa.id,
      titre: oa.titre,
      os: osByOa.get(oa.id) ?? [],
    });
  }

  const detailPaliers = paliers.map((p) => ({
    id: p.id,
    nom: p.nom,
    description: p.description,
    oas: oaByPalier.get(p.id) ?? [],
  }));

  return c.json({
    data: {
      disciplines,
      detail: {
        activite: activiteNom,
        competence: competences[0]?.description ?? "",
        paliers: detailPaliers,
      },
    },
  });
});

Deno.serve(app.fetch);
