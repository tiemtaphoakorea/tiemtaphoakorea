"use client";

import { Skeleton } from "@workspace/ui/components/skeleton";

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-8 w-28 rounded" />
      </div>
      <div className="rounded-lg border border-border bg-white">
        <div className="border-b px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b px-4 py-3 last:border-0">
            <Skeleton className="h-4 w-full opacity-70" />
          </div>
        ))}
      </div>
    </div>
  );
}
