/** UTF-8 BOM so Excel renders Vietnamese diacritics correctly. */
export const CSV_BOM = "﻿";

const CSV_PAGE_SIZE = 1000;

function escapeCsv(v: unknown): string {
  const s = v == null ? "" : String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: object[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escapeCsv((r as Record<string, unknown>)[h])).join(",")),
  ].join("\r\n");
}

export type Page<T> = { data: T[]; metadata: { total: number; totalPages: number } };

/** Fetch every page of a paginated service until exhausted. */
export async function fetchAllPages<T>(
  fetcher: (params: { page: number; limit: number }) => Promise<Page<T>>,
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const result = await fetcher({ page, limit: CSV_PAGE_SIZE });
    all.push(...result.data);
    if (page >= result.metadata.totalPages || result.data.length === 0) break;
    page += 1;
  }
  return all;
}

export function csvResponse(rows: object[], filename: string): Response {
  const csv = `${CSV_BOM}${toCsv(rows)}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
