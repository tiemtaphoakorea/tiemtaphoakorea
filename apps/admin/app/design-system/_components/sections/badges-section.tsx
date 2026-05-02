import { Badge } from "@workspace/ui/components/badge";
import { AlertCircle, Check, Info } from "lucide-react";
import { statusColors } from "../../_data/status-colors";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";
import { StatusPill } from "../status-pill";

export function BadgesSection() {
  return (
    <>
      <SectionHeader
        num="07"
        id="badges"
        title="Badges"
        desc="4 variants. rounded-full shape, text-xs weight. Used for status, labels, counts."
      />

      <ShowcaseBox title="variant" className="mb-4">
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </ShowcaseBox>

      <ShowcaseBox title="with-icon" className="mb-4">
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">
            <Check className="size-3" />
            Completed
          </Badge>
          <Badge variant="outline">
            <Info className="size-3" />
            Processing
          </Badge>
          <Badge variant="destructive">
            <AlertCircle className="size-3" />
            Cancelled
          </Badge>
        </div>
      </ShowcaseBox>

      <ShowcaseBox title="status-badges — applied with direct Tailwind utilities">
        <div className="flex flex-wrap gap-2">
          {statusColors.map((s) => (
            <StatusPill key={s.label} status={s} size="sm" />
          ))}
        </div>
      </ShowcaseBox>
    </>
  );
}
