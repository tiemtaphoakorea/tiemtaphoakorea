import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import Link from "next/link";
import { SectionTitle } from "./category-strip-eight";
import { GENERATED_ICONS, GeneratedIcon } from "./generated-icon";

function formatVnd(n: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(n))}đ`;
}

export function DealOfDay() {
  return (
    <section className="hidden md:block">
      <div className="container mx-auto px-4 py-9">
        <SectionTitle
          iconSrc={GENERATED_ICONS.deal}
          title="Deal of the day"
          sub="1 deal cực hời mỗi ngày — số lượng có hạn"
          more="Xem deal trước"
          moreHref={PUBLIC_ROUTES.PRODUCTS}
        />
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Big deal */}
          <div className="flex overflow-hidden rounded-3xl border border-border bg-white">
            <div
              className="grid min-h-[280px] flex-1 place-items-center text-[120px] font-black text-primary"
              style={{
                background: "linear-gradient(135deg,#EEF2FF,#FEF3C7)",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              韓
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2.5 p-6">
              <div className="mb-1.5 flex gap-1.5">
                <span className="inline-flex items-center rounded-full bg-destructive px-2.5 py-1 text-[12px] font-semibold leading-none text-white">
                  −42% TODAY
                </span>
                <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[12px] font-semibold leading-none text-primary">
                  CHÍNH HÃNG
                </span>
              </div>
              <h3 className="m-0 text-[22px] font-bold leading-[1.25] tracking-[-0.015em] text-foreground">
                Combo Hàn ăn cả tuần — 30 món chỉ trong 1 hộp
              </h3>
              <div className="flex items-baseline gap-2.5 text-[30px] font-extrabold tabular-nums leading-none tracking-[-0.02em] text-destructive">
                {formatVnd(579_000)}
                <s className="text-base font-medium text-muted-foreground line-through">
                  {formatVnd(999_000)}
                </s>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] font-medium leading-snug text-muted-foreground">
                <b className="text-warning">★ 4.9</b>
                (208 đánh giá) · Còn 12 hộp
              </div>
              <div className="mt-1.5 flex gap-2">
                <Link
                  href={PUBLIC_ROUTES.PRODUCTS}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-[26px] py-3.5 text-[14px] font-semibold leading-none text-white"
                  style={{ boxShadow: "0 4px 0 rgba(79,70,229,.18)" }}
                >
                  Săn ngay
                  <GeneratedIcon
                    src={GENERATED_ICONS.flash}
                    className="h-5 w-5 rounded-md object-contain"
                  />
                </Link>
                <Link
                  href={PUBLIC_ROUTES.PRODUCTS}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#EEF2FF] px-[26px] py-3.5 text-[14px] font-semibold leading-none text-primary"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          </div>

          {/* Testimonial 1 */}
          <Testimonial
            tag="★ Đánh giá thật"
            tagClass="bg-[#EEF2FF] text-primary"
            quote="“Shop gói hàng kỹ, mì còn date dài tới 2027. Giao 2 tiếng đúng hẹn. Lần sau ghé tiếp.”"
            iconSrc={GENERATED_ICONS.korea}
            initial="L"
            who="Linh · TP.HCM · 2 ngày trước"
          />

          {/* Testimonial 2 */}
          <Testimonial
            tag="✓ Đã mua"
            tagClass="bg-success-soft text-success"
            quote="“Mặt nạ Mediheal xịn y hệt mua bên Hàn. Giá còn rẻ hơn mà freeship. Ghi điểm tuyệt đối shop ơi!”"
            initial="N"
            who="Ngọc · Hà Nội · tuần trước"
          />
        </div>
      </div>
    </section>
  );
}

function Testimonial({
  tag,
  tagClass,
  quote,
  iconSrc,
  initial,
  who,
}: {
  tag: string;
  tagClass: string;
  quote: string;
  iconSrc?: string;
  initial: string;
  who: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-[18px]">
      <span
        className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none ${tagClass}`}
      >
        {tag}
      </span>
      {iconSrc ? (
        <GeneratedIcon src={iconSrc} className="h-7 w-7 rounded-lg object-contain" />
      ) : null}
      <div className="text-[14px] font-semibold leading-none text-warning">★★★★★</div>
      <p className="m-0 flex-1 text-[13px] font-normal leading-[1.55] text-foreground">{quote}</p>
      <div className="flex items-center gap-2 text-[12px] font-medium leading-none text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#EEF2FF] text-[12px] font-bold leading-none text-primary">
          {initial}
        </span>
        <span>{who}</span>
      </div>
    </div>
  );
}
