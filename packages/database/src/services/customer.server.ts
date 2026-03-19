import { CUSTOMER_CODE_PREFIX, type CUSTOMER_TYPE, ROLE } from "@repo/shared/constants";
import { calculateMetadata, PAGINATION_DEFAULT } from "@repo/shared/pagination";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db";
import { orders } from "../schema/orders";
import { profiles } from "../schema/profiles";

export async function getCustomers({
  search = "",
  page = PAGINATION_DEFAULT.PAGE,
  limit = PAGINATION_DEFAULT.LIMIT,
}: {
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const offset = (page - 1) * limit;
  const whereConditions: (any | undefined)[] = [eq(profiles.role, ROLE.CUSTOMER)];

  if (search) {
    whereConditions.push(
      or(
        ilike(profiles.fullName, `%${search}%`),
        ilike(profiles.customerCode, `%${search}%`),
        ilike(profiles.phone, `%${search}%`),
      ),
    );
  }

  const whereClause = and(...whereConditions.filter((c): c is any => !!c));

  // Total count query
  const totalQuery = db
    .select({ count: sql<number>`count(distinct ${profiles.id})` })
    .from(profiles)
    .where(whereClause);

  const [totalResult] = await totalQuery;
  const total = Number(totalResult?.count || 0);

  // Subquery for total spending and order count
  const customerStats = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      phone: profiles.phone,
      address: profiles.address,
      customerType: profiles.customerType,
      customerCode: profiles.customerCode,
      avatarUrl: profiles.avatarUrl,
      isActive: profiles.isActive,
      createdAt: profiles.createdAt,
      totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`.mapWith(Number),
      orderCount: sql<number>`count(${orders.id})`.mapWith(Number),
    })
    .from(profiles)
    .leftJoin(orders, eq(profiles.id, orders.customerId))
    .where(whereClause)
    .groupBy(profiles.id)
    .orderBy(desc(profiles.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    data: customerStats,
    metadata: calculateMetadata(total, page, limit),
  };
}

export async function getCustomerDetails(id: string) {
  const customer = await db.query.profiles.findFirst({
    where: eq(profiles.id, id),
    with: {
      orders: {
        orderBy: desc(orders.createdAt),
      },
    },
  });

  return customer;
}

async function generateCustomerCode(): Promise<string> {
  // Use timestamp-based code to avoid race conditions and conflicts
  const timestamp = Date.now().toString();
  const code = `${CUSTOMER_CODE_PREFIX}${timestamp.slice(-8)}`;

  // Check if code exists, if so, add a random suffix
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.customerCode, code),
  });

  if (existing) {
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `${code}-${random}`;
  }

  return code;
}

export async function createCustomer(data: {
  fullName: string;
  phone?: string;
  address?: string;
  customerType: (typeof CUSTOMER_TYPE)[keyof typeof CUSTOMER_TYPE];
}) {
  // NOTE: Customers do NOT have auth accounts - they are data records only
  // Only internal users (staff/employees) need authentication via User Management
  const customerCode = await generateCustomerCode();

  // Create Profile (no auth user)
  const [newProfile] = await db
    .insert(profiles)
    .values({
      username: `customer_${customerCode}`, // Generate unique username from customer code
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
      customerType: data.customerType,
      customerCode,
      role: ROLE.CUSTOMER,
    })
    .returning();

  return { profile: newProfile };
}

export async function updateCustomer(
  id: string,
  data: {
    fullName?: string;
    phone?: string;
    address?: string;
    customerType?: (typeof CUSTOMER_TYPE)[keyof typeof CUSTOMER_TYPE];
    isActive?: boolean;
  },
) {
  const [updatedProfile] = await db
    .update(profiles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, id))
    .returning();

  return updatedProfile;
}

export async function deleteCustomer(id: string) {
  const [deleted] = await db.delete(profiles).where(eq(profiles.id, id)).returning();
  return deleted;
}

// NOTE: resetCustomerPassword() removed - customers don't have auth accounts
// For internal user password reset, use User Management module
