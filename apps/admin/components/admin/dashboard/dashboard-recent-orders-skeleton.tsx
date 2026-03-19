import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";

export function DashboardRecentOrdersSkeleton() {
  return (
    <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-9 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="flex items-center justify-between py-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
