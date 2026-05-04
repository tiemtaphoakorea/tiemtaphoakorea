import { GENERATED_ICONS, GeneratedIcon } from "./generated-icon";

export function MobileGreeting() {
  return (
    <div className="flex items-center gap-2.5 px-4 pt-3 md:hidden">
      <div
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-lg font-black text-white"
        style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        K
      </div>
      <div className="leading-tight">
        <div className="text-[15px] font-extrabold tracking-tight text-foreground">K-SMART</div>
        <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <span>Hàng Hàn chính hãng · Có sẵn tại VN</span>
          <GeneratedIcon
            src={GENERATED_ICONS.korea}
            className="h-4 w-4 rounded-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
