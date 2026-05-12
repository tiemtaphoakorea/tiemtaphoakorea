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

/**
 * Build a CSV with multiple sections separated by blank lines.
 * Each section: optional title row, then header row + data rows.
 * Used for "chi tiết" exports that bundle multiple related tables.
 */
export type CsvSection = {
  title?: string;
  rows: object[];
};

export function toCsvSections(sections: CsvSection[]): string {
  return sections
    .filter((s) => s.rows.length > 0 || s.title)
    .map((s) => {
      const parts: string[] = [];
      if (s.title) parts.push(s.title);
      if (s.rows.length > 0) parts.push(toCsv(s.rows));
      return parts.join("\r\n");
    })
    .join("\r\n\r\n");
}

export function csvSectionsResponse(sections: CsvSection[], filename: string): Response {
  const csv = `${CSV_BOM}${toCsvSections(sections)}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
