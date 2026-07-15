import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Copy, Filter, ListTree, Search } from "lucide-react";
import { useSearchParams } from "react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { useProgrammeNavigation } from "@/hooks/useProgrammeNavigation";
import type { ProgrammeNavigationRow } from "@/services/programmeNavigationApi";

type FlatDisplayRow = ProgrammeNavigationRow & {
  row_key: string;
  activite_display_nom: string;
  source_activite_nom: string | null;
};

const PEDAGOGICAL_ACTIVITY_EXPANSIONS: Record<string, string[]> = {
  "Production d'écrits": ["Production d'écrits", "Grammaire", "Conjugaison", "Orthographe", "Vocabulaire"],
  "Expression orale et récitation": ["Expression orale et récitation", "Expression orale", "Récitation"],
  "Activités physiques et sportives": ["Activités physiques et sportives", "EPS"],
};

function expandFlatRows(rows: ProgrammeNavigationRow[]): FlatDisplayRow[] {
  return rows.flatMap((row) => {
    const labels = PEDAGOGICAL_ACTIVITY_EXPANSIONS[row.activite_nom] ?? [row.activite_nom];
    return labels.map((label, index) => ({
      ...row,
      row_key: index === 0 ? row.activite_id : `${row.activite_id}::${label}`,
      activite_display_nom: label,
      source_activite_nom: label === row.activite_nom ? null : row.activite_nom,
    }));
  });
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300/80 bg-slate-50/70 p-6 text-center text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/40">
      {message}
    </div>
  );
}

export function ProgrammeNavigationWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<"tree" | "flat">(() => {
    const raw = searchParams.get("navView");
    return raw === "flat" ? "flat" : "tree";
  });
  const [niveauId, setNiveauId] = useState<string>(() => searchParams.get("niveauId") ?? "all");
  const [domaineId, setDomaineId] = useState<string>(() => searchParams.get("domaineId") ?? "all");
  const [sousDomaineId, setSousDomaineId] = useState<string>(() => searchParams.get("sousDomaineId") ?? "all");
  const [search, setSearch] = useState(() => searchParams.get("navSearch") ?? "");
  const [page, setPage] = useState<number>(() => Math.max(Number(searchParams.get("navPage") ?? "1"), 1));
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState<"activite" | "niveau" | "domaine" | "compteurs">("activite");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const navParams = useMemo(
    () => ({
      niveauId: niveauId === "all" ? undefined : niveauId,
      domaineId: domaineId === "all" ? undefined : domaineId,
      sousDomaineId: sousDomaineId === "all" ? undefined : sousDomaineId,
      search: search.trim() || undefined,
      page,
      limit: 20,
    }),
    [niveauId, domaineId, sousDomaineId, search, page],
  );

  const {
    tree,
    flat,
    flatMeta,
    filters,
    isLoadingTree,
    isLoadingFlat,
    isLoadingFilters,
  } = useProgrammeNavigation(navParams);

  const activeRows = useMemo(() => expandFlatRows(flat), [flat]);

  const sortedRows = useMemo(() => {
    const rows = [...activeRows];
    const mul = sortDir === "asc" ? 1 : -1;

    rows.sort((a, b) => {
      if (sortBy === "activite") return mul * a.activite_display_nom.localeCompare(b.activite_display_nom, "fr");
      if (sortBy === "niveau") return mul * a.niveau_nom.localeCompare(b.niveau_nom, "fr");
      if (sortBy === "domaine") return mul * a.domaine_nom.localeCompare(b.domaine_nom, "fr");
      const aTotal = a.competences_count + a.paliers_count + a.oa_count + a.os_count + a.contenus_count;
      const bTotal = b.competences_count + b.paliers_count + b.oa_count + b.os_count + b.contenus_count;
      return mul * (aTotal - bTotal);
    });

    return rows;
  }, [activeRows, sortBy, sortDir]);

  function toggleSort(next: "activite" | "niveau" | "domaine" | "compteurs") {
    if (sortBy === next) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(next);
    setSortDir("asc");
  }

  async function handleCopyLink() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    next.set("navView", tab);
    if (niveauId === "all") next.delete("niveauId"); else next.set("niveauId", niveauId);
    if (domaineId === "all") next.delete("domaineId"); else next.set("domaineId", domaineId);
    if (sousDomaineId === "all") next.delete("sousDomaineId"); else next.set("sousDomaineId", sousDomaineId);
    if (!search.trim()) next.delete("navSearch"); else next.set("navSearch", search.trim());
    if (page <= 1) next.delete("navPage"); else next.set("navPage", String(page));

    setSearchParams(next, { replace: true });
  }, [tab, niveauId, domaineId, sousDomaineId, search, page, searchParams, setSearchParams]);

  const domainOptions = useMemo(() => {
    if (!filters?.domaines) return [];
    if (niveauId === "all") return filters.domaines;
    return filters.domaines.filter((d) => d.niveau_id === niveauId);
  }, [filters?.domaines, niveauId]);

  const sousDomainOptions = useMemo(() => {
    if (!filters?.sous_domaines) return [];
    if (domaineId === "all") return filters.sous_domaines;
    return filters.sous_domaines.filter((s) => s.domaine_id === domaineId);
  }, [filters?.sous_domaines, domaineId]);

  return (
    <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpenText className="h-4 w-4 text-emerald-600" /> Programme officiel
            </div>
            <CardTitle className="text-xl">Navigation pédagogique</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Front ready</Badge>
            <Badge className="bg-sky-600 text-white hover:bg-sky-700">Admin ready</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Filter className="h-3.5 w-3.5" /> Niveau
            </label>
            <Select
              value={niveauId}
              onValueChange={(value) => {
                setNiveauId(value);
                setDomaineId("all");
                setSousDomaineId("all");
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {(filters?.niveaux ?? []).map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Domaine</label>
            <Select
              value={domaineId}
              onValueChange={(value) => {
                setDomaineId(value);
                setSousDomaineId("all");
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les domaines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les domaines</SelectItem>
                {domainOptions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Sous-domaine</label>
            <Select
              value={sousDomaineId}
              onValueChange={(value) => {
                setSousDomaineId(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les sous-domaines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les sous-domaines</SelectItem>
                {sousDomainOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nom ?? "Sans nom"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Recherche</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Ex: Géographie"
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void handleCopyLink()}>
            <Copy className="h-4 w-4" />
            {copied ? "Lien copié" : "Copier le lien filtré"}
          </Button>
        </div>

        {(isLoadingFilters || isLoadingTree || isLoadingFlat) && (
          <div className="grid gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v === "flat" ? "flat" : "tree")} className="space-y-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tree" className="gap-1">
              <ListTree className="h-4 w-4" /> Arbre
            </TabsTrigger>
            <TabsTrigger value="flat" className="gap-1">
              <BookOpenText className="h-4 w-4" /> Liste
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tree">
            {tree.length === 0 ? (
              <EmptyState message="Aucun résultat pour les filtres sélectionnés." />
            ) : (
              <Accordion type="multiple" className="w-full rounded-xl border border-slate-200/70 px-4 dark:border-slate-800">
                {tree.map((niveau) => (
                  <AccordionItem key={niveau.id} value={niveau.id}>
                    <AccordionTrigger>{niveau.nom}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {niveau.domaines.map((domaine) => (
                          <div key={domaine.id} className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                            <p className="font-medium">{domaine.nom}</p>
                            <div className="mt-2 space-y-2">
                              {domaine.sous_domaines.map((sousDomaine) => (
                                <div key={sousDomaine.id} className="rounded-lg border border-slate-200/70 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{sousDomaine.nom ?? "Sans nom"}</p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {sousDomaine.activites.map((activite) => (
                                      <Badge key={activite.id} variant="outline" className="bg-white dark:bg-slate-900">
                                        {activite.nom}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="flat">
            {activeRows.length === 0 ? (
              <EmptyState message={isLoadingFlat ? "Chargement en cours..." : "Aucune activité trouvée."} />
            ) : (
              <div className="space-y-2 rounded-xl border border-slate-200/70 p-3 dark:border-slate-800">
                <div className="overflow-x-auto rounded-md border border-slate-200/70 dark:border-slate-800">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-slate-100/70 dark:bg-slate-900/70">
                      <tr>
                        <th className="px-3 py-2 text-left">
                          <button type="button" className="font-semibold" onClick={() => toggleSort("activite")}>
                            Activité {sortBy === "activite" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                          </button>
                        </th>
                        <th className="px-3 py-2 text-left">
                          <button type="button" className="font-semibold" onClick={() => toggleSort("niveau")}>
                            Niveau {sortBy === "niveau" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                          </button>
                        </th>
                        <th className="px-3 py-2 text-left">
                          <button type="button" className="font-semibold" onClick={() => toggleSort("domaine")}>
                            Domaine {sortBy === "domaine" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                          </button>
                        </th>
                        <th className="px-3 py-2 text-left">Sous-domaine</th>
                        <th className="px-3 py-2 text-left">
                          <button type="button" className="font-semibold" onClick={() => toggleSort("compteurs")}>
                            Compteurs {sortBy === "compteurs" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row) => (
                        <tr key={row.row_key} className="border-t border-slate-200/60 dark:border-slate-800">
                          <td className="px-3 py-2 font-medium">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>{row.activite_display_nom}</span>
                              {row.source_activite_nom && (
                                <span className="rounded-full border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                  alias de {row.source_activite_nom}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">{row.niveau_nom}</td>
                          <td className="px-3 py-2">{row.domaine_nom}</td>
                          <td className="px-3 py-2">{row.sous_domaine_nom ?? "Sans nom"}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            CB {row.competences_count} · P {row.paliers_count} · OA {row.oa_count} · OS {row.os_count} · C {row.contenus_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex flex-col gap-2 border-t border-slate-200/70 pt-3 text-xs text-muted-foreground dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Page {flatMeta?.page ?? page} / {flatMeta?.pageCount ?? 1} · {activeRows.length} activité(s) affichée(s)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={!flatMeta?.hasPrev}
                    >
                      Précédent
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!flatMeta?.hasNext}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
