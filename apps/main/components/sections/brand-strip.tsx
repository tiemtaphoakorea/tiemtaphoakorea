type Brand = { label: string };

const BRANDS: Brand[] = [
  { label: "SHIN" },
  { label: "PEPERO" },
  { label: "COSRX" },
  { label: "INNISFREE" },
  { label: "3CE" },
];

export function BrandStrip() {
  return (
    <section className="bg-background py-6 md:py-10">
      <div className="container mx-auto px-4">
        <div className="mb-4 md:mb-5">
          <h2 className="m-0 inline-flex items-center gap-2.5 text-[20px] font-bold leading-tight tracking-tight text-foreground md:text-2xl">
            Thương hiệu chính hãng
          </h2>
        </div>
        <div className="grid grid-cols-4 items-center gap-3 rounded-2xl border border-border bg-white p-5 md:grid-cols-8 md:gap-4 md:px-6 md:py-5">
          {BRANDS.map((b) => (
            <span
              key={b.label}
              className="grid h-[54px] place-items-center rounded-xl border border-transparent bg-surface text-[13px] font-bold leading-none text-muted-foreground transition-colors hover:border-[#EEF2FF] hover:bg-[#EEF2FF] hover:text-primary"
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
