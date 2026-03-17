import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardKPIsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="flex h-[130px] flex-col justify-between border-none p-6 shadow-sm">
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
  );
}
