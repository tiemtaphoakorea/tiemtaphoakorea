/** Hangul/Han accent thumb used in product/order/warehouse tables. Matches `.thumb` class. */
import Image from "next/image";

export type ThumbTone = "a" | "b" | "c" | "d" | "e";

const TONE_CLASSES: Record<ThumbTone, string> = {
  a: "bg-primary/10 text-primary",
  b: "bg-amber-100 text-amber-700",
  c: "bg-blue-100 text-blue-600",
  d: "bg-emerald-100 text-emerald-700",
  e: "bg-red-100 text-red-600",
};

type ProductThumbProps = {
  /** Single CJK character or initials. */
  label: string;
  tone?: ThumbTone;
  /** Size in pixels. Default 34 to match design. */
  size?: number;
  /** Optional image URL — shows image instead of label when provided. */
  src?: string;
};

export function ProductThumb({ label, tone = "a", size = 34, src }: ProductThumbProps) {
  if (src) {
    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-lg"
        style={{ width: size, height: size }}
      >
        <Image src={src} alt={label} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`grid shrink-0 place-items-center rounded-lg font-black ${TONE_CLASSES[tone]}`}
      style={{
        width: size,
        height: size,
        fontFamily: "'Noto Sans KR', 'Be Vietnam Pro', sans-serif",
        fontSize: Math.round(size * 0.44),
      }}
    >
      {label}
    </div>
  );
}
