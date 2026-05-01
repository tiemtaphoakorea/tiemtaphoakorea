import { Button } from "@workspace/ui/components/button";
import { Bell, Check, Copy, Package, Settings, ShoppingCart, Star, Trash2 } from "lucide-react";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";

export function ButtonsSection() {
  return (
    <>
      <SectionHeader
        num="06"
        id="buttons"
        title="Buttons"
        desc="6 variants × 8 sizes. Built on CVA + Radix Slot for asChild composition."
      />

      <ShowcaseBox title="variant" className="mb-4">
        <div className="flex flex-wrap gap-3">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </ShowcaseBox>

      <ShowcaseBox title="size" className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xs">Size xs</Button>
          <Button size="sm">Size sm</Button>
          <Button size="default">Size default</Button>
          <Button size="lg">Size lg</Button>
        </div>
      </ShowcaseBox>

      <ShowcaseBox title="icon variants" className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="icon-xs" variant="ghost">
            <Star />
          </Button>
          <Button size="icon-sm" variant="outline">
            <Bell />
          </Button>
          <Button size="icon">
            <Settings />
          </Button>
          <Button size="icon-lg" variant="secondary">
            <Package />
          </Button>
        </div>
      </ShowcaseBox>

      <ShowcaseBox title="with-icon" className="mb-4">
        <div className="flex flex-wrap gap-3">
          <Button>
            <ShoppingCart />
            Add to Cart
          </Button>
          <Button variant="outline">
            <Copy />
            Copy Link
          </Button>
          <Button variant="destructive">
            <Trash2 />
            Delete
          </Button>
          <Button variant="secondary" disabled>
            <Check />
            Saved
          </Button>
        </div>
      </ShowcaseBox>

      <ShowcaseBox title="states">
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button className="cursor-wait opacity-60">Loading…</Button>
        </div>
      </ShowcaseBox>
    </>
  );
}
