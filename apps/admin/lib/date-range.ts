import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export type DateRangeResult =
  | { ok: true; startDate: Date; endDate: Date }
  | { ok: false; response: NextResponse };

/**
 * Parses and validates `startDate` / `endDate` query params (YYYY-MM-DD or any
 * value `new Date()` accepts). On invalid input returns a pre-built 400.
 */
export function parseDateRange(searchParams: URLSearchParams): DateRangeResult {
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  if (!startDateParam || !endDateParam) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing required parameters: startDate and endDate" },
        { status: HTTP_STATUS.BAD_REQUEST },
      ),
    };
  }

  const startDate = new Date(startDateParam);
  const endDate = new Date(endDateParam);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid date format" },
        { status: HTTP_STATUS.BAD_REQUEST },
      ),
    };
  }

  if (startDate > endDate) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Start date must be before end date" },
        { status: HTTP_STATUS.BAD_REQUEST },
      ),
    };
  }

  return { ok: true, startDate, endDate };
}
