import { Skeleton } from "@workspace/ui/components/skeleton";
import { TableCell, TableRow } from "@workspace/ui/components/table";

/** Loading state for tables — shows N skeleton rows matching column count. */
export function TableLoadingRows({ rows = 5, cols }: { rows?: number; cols: number }) {
  return Array.from({ length: rows }).map((_, r) => (
    <TableRow key={r}>
      {Array.from({ length: cols }).map((_, c) => (
        <TableCell key={c} className="px-4 py-2.5">
          <Skeleton className="h-4 w-full max-w-45 rounded" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

/** Empty state for tables — single row spanning all cols. */
export function TableEmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="py-10 text-center text-sm text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}

/** Error state for tables. */
export function TableErrorRow({ cols, message }: { cols: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="py-10 text-center text-sm text-red-600">
        Lỗi tải dữ liệu: {message}
      </TableCell>
    </TableRow>
  );
}

import type { ThumbTone } from "./product-thumb";

/** Pick a deterministic thumb tone by hashing a string id/name. */
export function thumbToneFromId(id: string): ThumbTone {
  const tones: ThumbTone[] = ["a", "b", "c", "d", "e"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return tones[Math.abs(hash) % tones.length];
}

/** Initial char (or 1st CJK char) for thumbnail display. */
export function thumbLabelFromName(name: string): string {
  if (!name) return "?";
  // Prefer first non-ascii (CJK) char if present.
  for (const ch of name) {
    if (ch.charCodeAt(0) > 127) return ch;
  }
  return name.charAt(0).toUpperCase();
}
