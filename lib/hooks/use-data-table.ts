"use client";

import { useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";

export interface DataTableState {
  page: number;
  limit: number;
  search: string;
  sort: string;
  order: "asc" | "desc";
  from?: string;
  to?: string;
  [key: string]: any;
}

export function useDataTable(defaultSort = "created_at", defaultOrder: "asc" | "desc" = "desc") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo(() => {
    const params: DataTableState = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      search: searchParams.get("search") || "",
      sort: searchParams.get("sort") || defaultSort,
      order: (searchParams.get("order")?.toLowerCase() || defaultOrder) as "asc" | "desc",
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
    };

    // Add other params
    searchParams.forEach((value, key) => {
      if (!["page", "limit", "search", "sort", "order", "from", "to"].includes(key)) {
        params[key] = value;
      }
    });

    return params;
  }, [searchParams, defaultSort, defaultOrder]);

  const createQueryString = useCallback(
    (params: Partial<DataTableState>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      });

      return newSearchParams.toString();
    },
    [searchParams]
  );

  const updateUrl = useCallback(
    (params: Partial<DataTableState>) => {
      const query = createQueryString(params);
      router.push(`${pathname}?${query}`, { scroll: false });
    },
    [pathname, router, createQueryString]
  );

  const onPageChange = (page: number) => {
    updateUrl({ page });
  };

  const onLimitChange = (limit: number) => {
    updateUrl({ limit, page: 1 });
  };

  const onSortChange = (sort: string) => {
    const order = state.sort === sort && state.order === "desc" ? "asc" : "desc";
    updateUrl({ sort, order, page: 1 });
  };

  const onSearch = (search: string) => {
    updateUrl({ search, page: 1 });
  };

  const onDateRangeChange = (from?: Date, to?: Date) => {
    updateUrl({
      from: from ? format(from, "yyyy-MM-dd") : undefined,
      to: to ? format(to, "yyyy-MM-dd") : undefined,
      page: 1,
    });
  };

  const onFilterChange = (key: string, value: string | null) => {
    updateUrl({ [key]: value, page: 1 });
  };

  const clearFilters = () => {
    router.push(pathname, { scroll: false });
  };

  return {
    state,
    onPageChange,
    onLimitChange,
    onSortChange,
    onSearch,
    onDateRangeChange,
    onFilterChange,
    clearFilters,
  };
}
