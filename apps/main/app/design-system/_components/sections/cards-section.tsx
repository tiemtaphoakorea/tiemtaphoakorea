import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";

export function CardsSection() {
  return (
    <>
      <SectionHeader
        num="08"
        id="cards"
        title="Cards"
        desc="Slot-based composition: Card > CardHeader > (CardTitle + CardDescription + CardAction?) + CardContent + CardFooter."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <ShowcaseBox title="basic-card">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Product Analytics</CardTitle>
              <CardDescription>Last 30 days performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Revenue increased by 12% compared to previous period.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">
                View Report
              </Button>
            </CardFooter>
          </Card>
        </ShowcaseBox>

        <ShowcaseBox title="card-with-action">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Total Orders</CardTitle>
              <CardDescription>Today</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">1,248</p>
              <p className="mt-1 text-sm text-success">↑ 8.2% from yesterday</p>
            </CardContent>
          </Card>
        </ShowcaseBox>
      </div>
    </>
  );
}
