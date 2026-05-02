import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Separator } from "@workspace/ui/components/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Home } from "lucide-react";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";

export function NavigationSection() {
  return (
    <>
      <SectionHeader
        num="10"
        id="navigation"
        title="Navigation"
        desc="Breadcrumb, Tabs (default pill + line variants), Separator."
      />

      <ShowcaseBox title="breadcrumb" className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" className="flex items-center gap-1">
                <Home className="size-3.5" />
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Products</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Skincare</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </ShowcaseBox>

      <ShowcaseBox title="tabs — default (pill / segmented control)" className="mb-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Use for filter switchers / view toggles where state lives at one level. Compact (h-9).
        </p>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-3">
            <p className="text-sm text-muted-foreground">
              Overview tab content — product summary, quick stats, recent activity.
            </p>
          </TabsContent>
          <TabsContent value="analytics" className="mt-3">
            <p className="text-sm text-muted-foreground">
              Analytics tab content — charts, trends, conversion metrics.
            </p>
          </TabsContent>
          <TabsContent value="settings" className="mt-3">
            <p className="text-sm text-muted-foreground">
              Settings tab content — configuration, preferences, integrations.
            </p>
          </TabsContent>
        </Tabs>
      </ShowcaseBox>

      <ShowcaseBox title="tabs — line (content section tabs)" className="mb-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Use for primary section navigation in detail / dashboard pages — Linear / Vercel pattern.
        </p>
        <Tabs defaultValue="details">
          <TabsList variant="line">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-4">
            <p className="text-sm text-muted-foreground">
              Underline indicator under the active tab. No background pill.
            </p>
          </TabsContent>
          <TabsContent value="inventory" className="mt-4">
            <p className="text-sm text-muted-foreground">Stock levels, warehouse breakdown.</p>
          </TabsContent>
          <TabsContent value="reviews" className="mt-4">
            <p className="text-sm text-muted-foreground">Customer reviews and ratings.</p>
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <p className="text-sm text-muted-foreground">Edit history and audit log.</p>
          </TabsContent>
        </Tabs>
      </ShowcaseBox>

      <ShowcaseBox title="separator">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-foreground">Horizontal (default)</p>
            <Separator className="my-3" />
            <p className="text-sm text-muted-foreground/70">Content below separator</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">Item A</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm">Item B</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm">Item C</span>
          </div>
        </div>
      </ShowcaseBox>
    </>
  );
}
