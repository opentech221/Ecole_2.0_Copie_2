import { useQuery } from "@tanstack/react-query";
import { QK } from "../lib/queryClient";
import {
  programmeNavFunctionApi,
  type ProgrammeTreeNiveau,
  type ProgrammeFilters,
  type ProgrammeFlatMeta,
} from "../services/programmeNavFunctionApi";
import type { ProgrammeNavigationRow } from "../services/programmeNavigationApi";

type NavParams = {
  niveauId?: string;
  domaineId?: string;
  sousDomaineId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export function useProgrammeNavigation(params: NavParams = {}) {
  const treeQuery = useQuery({
    queryKey: QK.programmeNavTree(params),
    queryFn: async () => {
      const res = await programmeNavFunctionApi.getTree(params);
      return res.data as ProgrammeTreeNiveau[];
    },
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const flatQuery = useQuery({
    queryKey: QK.programmeNavFlat(params),
    queryFn: async () => {
      const res = await programmeNavFunctionApi.getFlat(params);
      return {
        data: res.data as ProgrammeNavigationRow[],
        meta: res.meta as ProgrammeFlatMeta,
      };
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const filtersQuery = useQuery({
    queryKey: QK.programmeNavFilters({
      niveauId: params.niveauId,
      domaineId: params.domaineId,
    }),
    queryFn: async () => {
      const res = await programmeNavFunctionApi.getFilters({
        niveauId: params.niveauId,
        domaineId: params.domaineId,
      });
      return res.data as ProgrammeFilters;
    },
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const trimmedSearch = (params.search ?? "").trim();
  const searchQuery = useQuery({
    queryKey: QK.programmeNavSearch(trimmedSearch, params.limit ?? 50),
    queryFn: async () => {
      const res = await programmeNavFunctionApi.search(trimmedSearch, params.limit ?? 50);
      return res.data as ProgrammeNavigationRow[];
    },
    enabled: trimmedSearch.length >= 2,
    staleTime: 1000 * 30,
    retry: 1,
  });

  return {
    tree: treeQuery.data ?? [],
    flat: flatQuery.data?.data ?? [],
    flatMeta: flatQuery.data?.meta,
    filters: filtersQuery.data,
    search: searchQuery.data ?? [],
    isLoadingTree: treeQuery.isLoading,
    isLoadingFlat: flatQuery.isLoading,
    isLoadingFilters: filtersQuery.isLoading,
    isSearching: searchQuery.isLoading,
    treeError: treeQuery.error,
    flatError: flatQuery.error,
    filtersError: filtersQuery.error,
    searchError: searchQuery.error,
    refetchTree: treeQuery.refetch,
    refetchFlat: flatQuery.refetch,
    refetchFilters: filtersQuery.refetch,
    refetchSearch: searchQuery.refetch,
  };
}
