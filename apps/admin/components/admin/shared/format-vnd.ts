/** Vietnamese currency formatter — `199.000đ`. Accepts numeric strings (Postgres numeric serializes as `"670000.00"`). */
export const formatVnd = (n: number | string | null | undefined): string => {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "0đ";
  return `${num.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}đ`;
};
