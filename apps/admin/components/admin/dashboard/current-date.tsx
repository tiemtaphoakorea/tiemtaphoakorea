"use client";

import { format } from "date-fns";

export function CurrentDate() {
  return <>{format(new Date(), "dd/MM/yyyy")}</>;
}
