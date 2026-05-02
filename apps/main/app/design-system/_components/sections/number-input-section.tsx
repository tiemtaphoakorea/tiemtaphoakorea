import { Label } from "@workspace/ui/components/label";
import { NumberInput } from "@workspace/ui/components/number-input";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";

export function NumberInputSection() {
  return (
    <>
      <SectionHeader
        num="15"
        id="number-input"
        title="Number Input"
        desc="react-number-format wrapper. Vietnamese locale: thousand separator (.) and decimal separator (,). Rounds cleanly for currency."
      />

      <ShowcaseBox title="number-input">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Product price (₫)</Label>
            <NumberInput placeholder="0" suffix=" ₫" defaultValue={285000} />
            <p className="text-xs text-muted-foreground/70">
              Formats: 285.000 ₫ · Separator: (.) thousands, (,) decimal
            </p>
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <NumberInput placeholder="0" defaultValue={12} />
          </div>
          <div className="space-y-2">
            <Label>Discount (%)</Label>
            <NumberInput
              placeholder="0"
              suffix="%"
              decimalScale={1}
              max={100}
              defaultValue={15.5}
            />
          </div>
          <div className="space-y-2">
            <Label>Disabled</Label>
            <NumberInput placeholder="0" defaultValue={99000} disabled />
          </div>
        </div>
      </ShowcaseBox>
    </>
  );
}
