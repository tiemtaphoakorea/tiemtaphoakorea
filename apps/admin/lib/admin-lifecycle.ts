const RESTORE_WINDOW_MS = 10_000;

let lastRestoreAt: number | null = null;

export function recordPageRestore(now: number = Date.now()): void {
  lastRestoreAt = now;
}

export function wasRecentlyRestored(now: number = Date.now()): boolean {
  if (lastRestoreAt === null) return false;
  return now - lastRestoreAt <= RESTORE_WINDOW_MS;
}

type QueryClientLike = {
  getQueryCache: () => { getAll: () => Array<{ state: { status: string; fetchStatus: string } }> };
  cancelQueries: (filter?: unknown) => void;
  invalidateQueries: (filter?: unknown) => void;
};

export function recoverFrozenQueries(queryClient: QueryClientLike): void {
  const frozen = queryClient
    .getQueryCache()
    .getAll()
    .filter((q) => q.state.status === "pending" && q.state.fetchStatus === "fetching");

  if (frozen.length === 0) return;

  queryClient.cancelQueries();
  queryClient.invalidateQueries();
}

type PageCheckArgs = {
  querySelector: (selector: string) => Element | null | object;
  reload: () => void;
  now: number;
};

export function recoverStuckPageSkeleton({ querySelector, reload, now }: PageCheckArgs): void {
  if (!wasRecentlyRestored(now)) return;
  const skeleton = querySelector("[data-page-skeleton]");
  if (!skeleton) return;
  reload();
}

export function recoverRestoredPage({
  queryClient,
  querySelector,
  reload,
  now,
}: PageCheckArgs & { queryClient: QueryClientLike }): void {
  recordPageRestore(now);
  recoverFrozenQueries(queryClient);
  recoverStuckPageSkeleton({ querySelector, reload, now });
}
