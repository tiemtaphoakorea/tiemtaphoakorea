import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { avatarStackColors } from "../../_data/quick-reference";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";

const SCROLL_ITEMS = Array.from({ length: 12 }, (_, i) => i + 1);

export function DataDisplaySection() {
  return (
    <>
      <SectionHeader
        num="11"
        id="data-display"
        title="Data Display"
        desc="Avatar, Skeleton, ScrollArea — for presenting structured information. See section 12 for Table & DataTable."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <ShowcaseBox title="avatar">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <Avatar className="size-12">
                <AvatarImage src="https://api.dicebear.com/9.x/initials/svg?seed=KH" alt="KH" />
                <AvatarFallback>KH</AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground/70">size-12</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Avatar className="size-10">
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground/70">fallback</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Avatar className="size-8">
                <AvatarFallback>CD</AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground/70">size-8</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Avatar className="size-6">
                <AvatarFallback className="text-xs">EF</AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground/70">size-6</p>
            </div>
            {/* Plain divs avoid inline-style/Radix shape conflicts on stacked avatars */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex -space-x-2">
                {avatarStackColors.map((color, i) => (
                  <div
                    key={color}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-background text-xs font-semibold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
                  +5
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70">stack</p>
            </div>
          </div>
        </ShowcaseBox>

        <ShowcaseBox title="skeleton">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        </ShowcaseBox>
      </div>

      <ShowcaseBox title="scroll-area" className="mt-4">
        {/* overflow-hidden ensures the Radix Root clips correctly */}
        <div className="h-36 overflow-hidden rounded-lg border border-border">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-4">
              {SCROLL_ITEMS.map((n) => (
                <div key={n} className="flex items-center gap-3 py-1">
                  <div className="size-6 rounded bg-muted text-center text-xs leading-6 text-muted-foreground">
                    {n}
                  </div>
                  <p className="text-sm text-foreground">Scrollable list item {n}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </ShowcaseBox>
    </>
  );
}
