import { eq, sql } from "drizzle-orm";
import { documentSequences } from "../schema/document-sequences";
import type { DbTransaction } from "../types/database";

const CODE_PAD_LENGTH = 5;

/**
 * Atomically allocate the next monotonic document code for a given prefix.
 * Uses UPDATE ... RETURNING to avoid race conditions; the sequence row must
 * exist (seeded via migration 0009).
 */
export async function nextDocumentCode(tx: DbTransaction, prefix: string): Promise<string> {
  const rows = await tx
    .update(documentSequences)
    .set({ lastSeq: sql`${documentSequences.lastSeq} + 1` })
    .where(eq(documentSequences.prefix, prefix))
    .returning({ lastSeq: documentSequences.lastSeq });

  if (rows.length === 0) {
    // Fallback: lazily seed the sequence if missing (e.g. fresh prefix).
    await tx.insert(documentSequences).values({ prefix, lastSeq: 1 }).onConflictDoNothing();
    return `${prefix}${"1".padStart(CODE_PAD_LENGTH, "0")}`;
  }

  const seq = rows[0]!.lastSeq;
  return `${prefix}${String(seq).padStart(CODE_PAD_LENGTH, "0")}`;
}
