import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export function useSortableData<T extends Record<string, unknown>>(
  data: T[],
  defaultKey?: string,
  defaultDir: SortDirection = "asc"
) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(
    defaultKey ? { key: defaultKey, direction: defaultDir } : null
  );

  const sorted = useMemo(() => {
    if (!sortConfig) return data;
    const { key, direction } = sortConfig;
    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      let cmp: number;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return direction === "asc" ? cmp : -cmp;
    });
  }, [data, sortConfig]);

  function requestSort(key: string) {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  }

  function getSortIndicator(key: string) {
    if (sortConfig?.key !== key) return " ↕";
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  }

  return { sorted, sortConfig, requestSort, getSortIndicator };
}
