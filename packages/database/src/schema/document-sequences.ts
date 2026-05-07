import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

// Monotonic sequence per document prefix (OSN/PON/PCH/IAN/CDC).
// Atomic increment via UPDATE ... RETURNING last_seq.
// One row per prefix, seeded by migration; service layer ensures the row exists.
export const documentSequences = pgTable("document_sequences", {
  prefix: varchar("prefix", { length: 16 }).primaryKey(),
  lastSeq: integer("last_seq").notNull().default(0),
});
