import { type NextRequest, NextResponse } from "next/server";
import { getInternalUser } from "@/lib/auth.server";
import { ROLE } from "@/lib/constants";
import { HTTP_STATUS } from "@/lib/http-status";
import { calculateMetadata, getPaginationParams } from "@/lib/pagination";
import { createExpense, getExpenses } from "@/services/finance.server";

export async function GET(request: NextRequest) {
  const user = await getInternalUser(request);

  // Expenses are Owner-only
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: HTTP_STATUS.FORBIDDEN },
    );
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, offset } = getPaginationParams(request);
  const month = searchParams.get("month")
    ? Number.parseInt(searchParams.get("month")!, 10)
    : undefined;
  const year = searchParams.get("year")
    ? Number.parseInt(searchParams.get("year")!, 10)
    : undefined;
  const type = searchParams.get("type") as "fixed" | "variable" | undefined;

  try {
    const { data, total } = await getExpenses({
      month,
      year,
      type,
      offset,
      limit,
    });

    return NextResponse.json({
      data,
      metadata: calculateMetadata(total, page, limit),
    });
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getInternalUser(request);

  // Expenses are Owner-only
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: HTTP_STATUS.FORBIDDEN },
    );
  }

  try {
    const body = await request.json();

    if (!body.amount || Number(body.amount) <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be positive" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const expense = await createExpense({
      ...body,
      date: new Date(body.date),
      createdBy: user.profile.id,
    });
    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error("Failed to create expense:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
