import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { sheetCategories, sheetSides } from "../../_data/quick-reference";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";

export function SheetSection() {
  return (
    <>
      <SectionHeader
        num="14"
        id="sheet"
        title="Sheet"
        desc="Side-anchored drawer built on Radix Dialog. Supports left, right, top, and bottom sides."
      />

      <ShowcaseBox title="sheet — all sides">
        <div className="flex flex-wrap gap-3">
          {sheetSides.map((side) => (
            <Sheet key={side}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="capitalize">
                  {side}
                </Button>
              </SheetTrigger>
              <SheetContent side={side}>
                <SheetHeader>
                  <SheetTitle>Sheet — {side}</SheetTitle>
                  <SheetDescription>
                    This sheet slides in from the {side}. Use for navigation, filters, or detail
                    panels.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`ds-sheet-input-${side}`}>Filter by name</Label>
                      <Input id={`ds-sheet-input-${side}`} placeholder="Search…" />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <div className="flex flex-col gap-1.5">
                        {sheetCategories.map((cat) => (
                          <div key={cat} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`ds-${side}-${cat}`}
                              className="size-4 rounded"
                            />
                            <Label htmlFor={`ds-${side}-${cat}`}>{cat}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <SheetFooter>
                  <Button variant="outline" className="flex-1">
                    Reset
                  </Button>
                  <Button className="flex-1">Apply Filters</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          ))}
        </div>
      </ShowcaseBox>
    </>
  );
}
