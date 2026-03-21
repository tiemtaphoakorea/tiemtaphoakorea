import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

export function FinanceStatsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <Card
            key={n}
            className="flex h-[130px] flex-col justify-between border-none p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div>
              <Skeleton className="mb-2 h-8 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden rounded-2xl border-none p-0 shadow-sm ring-1 ring-slate-200 lg:col-span-2 dark:ring-slate-800">
          <CardHeader className="border-b border-slate-100 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-1 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-slate-100 p-5 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex h-[400px] flex-col overflow-hidden rounded-2xl border-none p-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
          <div className="flex flex-1 flex-col items-center justify-center space-y-6 p-8">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex w-full flex-col items-center space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
          <div className="p-6 pt-0">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </Card>
      </div>
    </>
  );
}
