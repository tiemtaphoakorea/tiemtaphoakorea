import { vi } from "vitest";

type ChainableMethod =
  | "from"
  | "where"
  | "leftJoin"
  | "innerJoin"
  | "groupBy"
  | "orderBy"
  | "limit"
  | "offset";

const CHAINABLE_METHODS: ChainableMethod[] = [
  "from",
  "where",
  "leftJoin",
  "innerJoin",
  "groupBy",
  "orderBy",
  "limit",
  "offset",
];

/**
 * Creates a thenable chain object compatible with Drizzle query builder chains in tests.
 */
export function createChainableQueryMock<T>(result: T[]): Record<string, unknown> {
  const chain: Record<string, unknown> = {};

  for (const method of CHAINABLE_METHODS) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // biome-ignore lint/suspicious/noThenProperty: Intended thenable object for mocked async query chain
  chain.then = (resolve: (value: T[]) => unknown) => resolve(result);
  chain.map = (mapper: (item: T) => unknown) => result.map(mapper);

  return chain;
}

/**
 * Wires `db.select()` to return queued results in order of invocation.
 */
export function mockSelectWithQueue(
  dbMock: { select: ReturnType<typeof vi.fn> },
  queue: unknown[][],
) {
  dbMock.select.mockImplementation(() => createChainableQueryMock(queue.shift() ?? []));
}
