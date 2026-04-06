import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hashPassword } from "../packages/database/src/lib/security";
import * as schema from "../packages/database/src/schema";
import { ROLE } from "../packages/shared/src/constants";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

const DEFAULT_PASSWORD = "password123";
const DEFAULT_AGENT_USERNAME = "ai_agent_bot";
const DEFAULT_AGENT_DISPLAY_NAME = "AI Agent";

const USERS = [
  {
    username: "admin",
    fullName: "Admin User",
    role: ROLE.OWNER,
    isActive: true,
    phone: "0900000001",
  },
];

const AGENT_PROFILE_SEED = {
  username: process.env.AI_AGENT_USERNAME?.trim() || DEFAULT_AGENT_USERNAME,
  fullName: process.env.AI_AGENT_DISPLAY_NAME?.trim() || DEFAULT_AGENT_DISPLAY_NAME,
  role: ROLE.STAFF,
  isActive: true,
};

const CATEGORY_SEEDS = [
  {
    name: "Beverages",
    slug: "beverages",
    description: "All drinks",
    displayOrder: 1,
  },
  {
    name: "Pantry",
    slug: "pantry",
    description: "Pantry staples",
    displayOrder: 2,
  },
  {
    name: "Snacks",
    slug: "snacks",
    description: "Snack foods",
    displayOrder: 3,
  },
  {
    name: "Coffee",
    slug: "coffee",
    description: "Coffee products",
    displayOrder: 10,
    parentSlug: "beverages",
  },
  {
    name: "Tea",
    slug: "tea",
    description: "Tea products",
    displayOrder: 11,
    parentSlug: "beverages",
  },
  {
    name: "Grains",
    slug: "grains",
    description: "Rice & grains",
    displayOrder: 20,
    parentSlug: "pantry",
  },
  {
    name: "Spices",
    slug: "spices",
    description: "Spices and seasoning",
    displayOrder: 21,
    parentSlug: "pantry",
  },
  {
    name: "Chips",
    slug: "chips",
    description: "Chips & crisps",
    displayOrder: 30,
    parentSlug: "snacks",
  },
  {
    name: "Nuts",
    slug: "nuts",
    description: "Nuts & dried fruits",
    displayOrder: 31,
    parentSlug: "snacks",
  },
  {
    name: "Dairy",
    slug: "dairy",
    description: "Milk & dairy",
    displayOrder: 40,
  },
  {
    name: "Personal Care",
    slug: "personal-care",
    description: "Personal care products",
    displayOrder: 50,
  },
  {
    name: "Household",
    slug: "household",
    description: "Home essentials",
    displayOrder: 60,
  },
  {
    name: "Milk",
    slug: "milk",
    description: "Milk products",
    displayOrder: 41,
    parentSlug: "dairy",
  },
  {
    name: "Yogurt",
    slug: "yogurt",
    description: "Yogurt products",
    displayOrder: 42,
    parentSlug: "dairy",
  },
  {
    name: "Soap",
    slug: "soap",
    description: "Hand and body soap",
    displayOrder: 51,
    parentSlug: "personal-care",
  },
  {
    name: "Shampoo",
    slug: "shampoo",
    description: "Hair care products",
    displayOrder: 52,
    parentSlug: "personal-care",
  },
  {
    name: "Cleaning",
    slug: "cleaning",
    description: "Cleaning supplies",
    displayOrder: 61,
    parentSlug: "household",
  },
];

const PRODUCT_SEEDS = [
  {
    name: "Premium Coffee",
    slug: "premium-coffee",
    description: "Arabica blend",
    basePrice: "120.00",
    categorySlug: "coffee",
  },
  {
    name: "Robusta Coffee",
    slug: "robusta-coffee",
    description: "Strong flavor",
    basePrice: "95.00",
    categorySlug: "coffee",
  },
  {
    name: "Jasmine Tea",
    slug: "jasmine-tea",
    description: "Floral green tea",
    basePrice: "60.00",
    categorySlug: "tea",
  },
  {
    name: "Sencha Tea",
    slug: "sencha-tea",
    description: "Japanese green tea",
    basePrice: "75.00",
    categorySlug: "tea",
  },
  {
    name: "Premium Rice",
    slug: "premium-rice",
    description: "Fragrant rice 5kg",
    basePrice: "180.00",
    categorySlug: "grains",
  },
  {
    name: "Chili Powder",
    slug: "chili-powder",
    description: "Spicy chili powder",
    basePrice: "40.00",
    categorySlug: "spices",
  },
  {
    name: "Potato Chips",
    slug: "potato-chips",
    description: "Crispy chips",
    basePrice: "35.00",
    categorySlug: "chips",
  },
  {
    name: "Mixed Nuts",
    slug: "mixed-nuts",
    description: "Assorted nuts",
    basePrice: "90.00",
    categorySlug: "nuts",
  },
  {
    name: "Sparkling Water",
    slug: "sparkling-water",
    description: "Refreshing drink",
    basePrice: "20.00",
    categorySlug: "beverages",
  },
  {
    name: "Cooking Oil",
    slug: "cooking-oil",
    description: "Premium cooking oil 1L",
    basePrice: "85.00",
    categorySlug: "pantry",
  },
  {
    name: "Snack Box",
    slug: "snack-box",
    description: "Mixed snack combo",
    basePrice: "150.00",
    categorySlug: "snacks",
  },
  {
    name: "Fresh Milk",
    slug: "fresh-milk",
    description: "Fresh milk 1L",
    basePrice: "32.00",
    categorySlug: "milk",
  },
  {
    name: "Greek Yogurt",
    slug: "greek-yogurt",
    description: "Plain greek yogurt",
    basePrice: "28.00",
    categorySlug: "yogurt",
  },
  {
    name: "Hand Soap",
    slug: "hand-soap",
    description: "Gentle hand soap",
    basePrice: "18.00",
    categorySlug: "soap",
  },
  {
    name: "Herbal Shampoo",
    slug: "herbal-shampoo",
    description: "Natural herbal shampoo",
    basePrice: "65.00",
    categorySlug: "shampoo",
  },
  {
    name: "Dishwashing Liquid",
    slug: "dishwashing-liquid",
    description: "Lemon dishwashing liquid",
    basePrice: "25.00",
    categorySlug: "cleaning",
  },
];

const VARIANT_SEEDS = [
  {
    sku: "COF-250G",
    name: "Premium Coffee 250g",
    price: "120.00",
    costPrice: "70.00",
    stockQuantity: 50,
    lowStockThreshold: 5,
    productSlug: "premium-coffee",
  },
  {
    sku: "COF-500G",
    name: "Premium Coffee 500g",
    price: "210.00",
    costPrice: "125.00",
    stockQuantity: 35,
    lowStockThreshold: 5,
    productSlug: "premium-coffee",
  },
  {
    sku: "RCOF-250G",
    name: "Robusta Coffee 250g",
    price: "95.00",
    costPrice: "55.00",
    stockQuantity: 60,
    lowStockThreshold: 8,
    productSlug: "robusta-coffee",
  },
  {
    sku: "RCOF-1KG",
    name: "Robusta Coffee 1kg",
    price: "320.00",
    costPrice: "200.00",
    stockQuantity: 20,
    lowStockThreshold: 3,
    productSlug: "robusta-coffee",
  },
  {
    sku: "TEA-JAS-100G",
    name: "Jasmine Tea 100g",
    price: "60.00",
    costPrice: "35.00",
    stockQuantity: 80,
    lowStockThreshold: 10,
    productSlug: "jasmine-tea",
  },
  {
    sku: "TEA-JAS-200G",
    name: "Jasmine Tea 200g",
    price: "105.00",
    costPrice: "65.00",
    stockQuantity: 50,
    lowStockThreshold: 8,
    productSlug: "jasmine-tea",
  },
  {
    sku: "TEA-SEN-100G",
    name: "Sencha Tea 100g",
    price: "75.00",
    costPrice: "45.00",
    stockQuantity: 40,
    lowStockThreshold: 6,
    productSlug: "sencha-tea",
  },
  {
    sku: "RICE-5KG",
    name: "Premium Rice 5kg",
    price: "180.00",
    costPrice: "120.00",
    stockQuantity: 25,
    lowStockThreshold: 4,
    productSlug: "premium-rice",
  },
  {
    sku: "RICE-10KG",
    name: "Premium Rice 10kg",
    price: "330.00",
    costPrice: "220.00",
    stockQuantity: 15,
    lowStockThreshold: 3,
    productSlug: "premium-rice",
  },
  {
    sku: "CHILI-200G",
    name: "Chili Powder 200g",
    price: "40.00",
    costPrice: "22.00",
    stockQuantity: 70,
    lowStockThreshold: 10,
    productSlug: "chili-powder",
  },
  {
    sku: "CHIPS-ORIG",
    name: "Potato Chips Original",
    price: "35.00",
    costPrice: "18.00",
    stockQuantity: 120,
    lowStockThreshold: 15,
    productSlug: "potato-chips",
  },
  {
    sku: "CHIPS-SEA",
    name: "Potato Chips Seaweed",
    price: "38.00",
    costPrice: "20.00",
    stockQuantity: 90,
    lowStockThreshold: 12,
    productSlug: "potato-chips",
  },
  {
    sku: "NUTS-250G",
    name: "Mixed Nuts 250g",
    price: "90.00",
    costPrice: "55.00",
    stockQuantity: 55,
    lowStockThreshold: 8,
    productSlug: "mixed-nuts",
  },
  {
    sku: "WATER-500ML",
    name: "Sparkling Water 500ml",
    price: "20.00",
    costPrice: "12.00",
    stockQuantity: 200,
    lowStockThreshold: 25,
    productSlug: "sparkling-water",
  },
  {
    sku: "OIL-1L",
    name: "Cooking Oil 1L",
    price: "85.00",
    costPrice: "60.00",
    stockQuantity: 40,
    lowStockThreshold: 6,
    productSlug: "cooking-oil",
  },
  {
    sku: "SNACK-BOX",
    name: "Snack Box Combo",
    price: "150.00",
    costPrice: "95.00",
    stockQuantity: 30,
    lowStockThreshold: 5,
    productSlug: "snack-box",
  },
  {
    sku: "MILK-1L",
    name: "Fresh Milk 1L",
    price: "32.00",
    costPrice: "20.00",
    stockQuantity: 80,
    lowStockThreshold: 10,
    productSlug: "fresh-milk",
  },
  {
    sku: "YOG-400G",
    name: "Greek Yogurt 400g",
    price: "28.00",
    costPrice: "18.00",
    stockQuantity: 60,
    lowStockThreshold: 8,
    productSlug: "greek-yogurt",
  },
  {
    sku: "SOAP-500ML",
    name: "Hand Soap 500ml",
    price: "18.00",
    costPrice: "10.00",
    stockQuantity: 90,
    lowStockThreshold: 12,
    productSlug: "hand-soap",
  },
  {
    sku: "SHAM-500ML",
    name: "Herbal Shampoo 500ml",
    price: "65.00",
    costPrice: "40.00",
    stockQuantity: 45,
    lowStockThreshold: 6,
    productSlug: "herbal-shampoo",
  },
  {
    sku: "DISH-1L",
    name: "Dishwashing Liquid 1L",
    price: "25.00",
    costPrice: "15.00",
    stockQuantity: 70,
    lowStockThreshold: 10,
    productSlug: "dishwashing-liquid",
  },
];

const VARIANT_IMAGE_SEEDS: Record<string, string> = {
  "COF-250G":
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
  "COF-500G":
    "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80",
  "RCOF-250G":
    "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=800&q=80",
  "RCOF-1KG":
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80",
  "TEA-JAS-100G":
    "https://images.unsplash.com/photo-1504387432042-8aca549e4729?auto=format&fit=crop&w=800&q=80",
  "TEA-JAS-200G":
    "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=800&q=80",
  "TEA-SEN-100G":
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
  "RICE-5KG":
    "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=800&q=80",
  "RICE-10KG":
    "https://images.unsplash.com/photo-1505576391880-b3f9d713dc4f?auto=format&fit=crop&w=800&q=80",
  "CHILI-200G":
    "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80",
  "CHIPS-ORIG":
    "https://images.unsplash.com/photo-1528736235302-52922df5c122?auto=format&fit=crop&w=800&q=80",
  "CHIPS-SEA":
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
  "NUTS-250G":
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80",
  "WATER-500ML":
    "https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=800&q=80",
  "OIL-1L":
    "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
  "SNACK-BOX":
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
  "MILK-1L":
    "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=800&q=80",
  "YOG-400G":
    "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80",
  "SOAP-500ML":
    "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=800&q=80",
  "SHAM-500ML":
    "https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&w=800&q=80",
  "DISH-1L":
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
};

const SUPPLIER_SEED = {
  code: "NCC001",
  name: "Saigon Coffee Supplier",
  phone: "0281234567",
  email: "supplier@coffee.example",
  address: "45 Nguyen Hue, District 1, HCMC",
  paymentTerms: "Thanh toán sau 30 ngày",
  note: "E2E seed supplier",
  isActive: true,
};

const SYSTEM_SETTINGS = [
  {
    key: "store_name",
    value: { value: "Auth Shop Platform" },
    description: "Store display name",
  },
  {
    key: "support_phone",
    value: { value: "1900-1000" },
    description: "Support hotline",
  },
];

async function upsertById<T extends { id: string }>(
  table: any,
  idColumn: any,
  findExisting: () => Promise<T | undefined>,
  insertValues: Record<string, unknown>,
  updateValues: Record<string, unknown>,
) {
  const existing = await findExisting();
  if (existing) {
    await db.update(table).set(updateValues).where(eq(idColumn, existing.id));
    return existing;
  }

  const [created] = await db.insert(table).values(insertValues).returning();
  return created as T;
}

async function seedE2E() {
  console.log("🧪 Seeding E2E data...");

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  console.log("  → Profiles");
  const seededProfiles = new Map<string, { id: string }>();

  for (const user of USERS) {
    const profile = await upsertById(
      schema.profiles,
      schema.profiles.id,
      () =>
        db.query.profiles.findFirst({
          where: eq(schema.profiles.username, user.username),
        }),
      {
        ...user,
        passwordHash,
      },
      {
        ...user,
        passwordHash,
        updatedAt: new Date(),
      },
    );
    seededProfiles.set(user.username, profile);
    console.log(`  ✓ Seeded: ${user.username}`);
  }

  const agentProfile = await upsertById(
    schema.profiles,
    schema.profiles.id,
    () =>
      db.query.profiles.findFirst({
        where: eq(schema.profiles.username, AGENT_PROFILE_SEED.username),
      }),
    {
      ...AGENT_PROFILE_SEED,
      passwordHash,
    },
    {
      ...AGENT_PROFILE_SEED,
      passwordHash,
      updatedAt: new Date(),
    },
  );
  seededProfiles.set(AGENT_PROFILE_SEED.username, agentProfile);
  console.log(`  ✓ Seeded: ${AGENT_PROFILE_SEED.username} (AI agent bot)`);

  const adminProfile = seededProfiles.get("admin");
  const customerProfile = seededProfiles.get("customer_login");

  if (!adminProfile) {
    throw new Error("Missing required admin profile for seed data.");
  }

  console.log("  → Categories");
  const categoryBySlug = new Map<string, { id: string }>();
  const parentCategories = CATEGORY_SEEDS.filter((category) => !category.parentSlug);
  const childCategories = CATEGORY_SEEDS.filter((category) => category.parentSlug);

  for (const category of parentCategories) {
    const { parentSlug, ...values } = category;
    const record = await upsertById(
      schema.categories,
      schema.categories.id,
      () =>
        db.query.categories.findFirst({
          where: eq(schema.categories.slug, category.slug),
        }),
      { ...values },
      { ...values, updatedAt: new Date() },
    );
    categoryBySlug.set(category.slug, record);
  }

  for (const category of childCategories) {
    const { parentSlug, ...values } = category;
    const parent = categoryBySlug.get(parentSlug ?? "");
    if (!parent) {
      throw new Error(`Missing parent category for slug: ${parentSlug}`);
    }
    const record = await upsertById(
      schema.categories,
      schema.categories.id,
      () =>
        db.query.categories.findFirst({
          where: eq(schema.categories.slug, category.slug),
        }),
      { ...values, parentId: parent.id },
      { ...values, parentId: parent.id, updatedAt: new Date() },
    );
    categoryBySlug.set(category.slug, record);
  }

  console.log("  → Suppliers");
  const supplier = await upsertById(
    schema.suppliers,
    schema.suppliers.id,
    () =>
      db.query.suppliers.findFirst({
        where: eq(schema.suppliers.code, SUPPLIER_SEED.code),
      }),
    {
      ...SUPPLIER_SEED,
    },
    {
      ...SUPPLIER_SEED,
      updatedAt: new Date(),
    },
  );

  console.log("  → Products & Variants");
  const productBySlug = new Map<string, any>();
  for (const productSeed of PRODUCT_SEEDS) {
    const category = categoryBySlug.get(productSeed.categorySlug);
    if (!category) {
      throw new Error(`Missing category for product: ${productSeed.slug}`);
    }
    const { categorySlug, ...values } = productSeed;
    const product = await upsertById(
      schema.products,
      schema.products.id,
      () =>
        db.query.products.findFirst({
          where: eq(schema.products.slug, productSeed.slug),
        }),
      { ...values, categoryId: category.id },
      { ...values, categoryId: category.id, updatedAt: new Date() },
    );
    productBySlug.set(productSeed.slug, product);
  }

  const variantBySku = new Map<string, any>();
  for (const variantSeed of VARIANT_SEEDS) {
    const product = productBySlug.get(variantSeed.productSlug);
    if (!product) {
      throw new Error(`Missing product for variant: ${variantSeed.sku}`);
    }
    const { productSlug, ...values } = variantSeed;
    const variant = await upsertById(
      schema.productVariants,
      schema.productVariants.id,
      () =>
        db.query.productVariants.findFirst({
          where: eq(schema.productVariants.sku, variantSeed.sku),
        }),
      { ...values, productId: product.id },
      { ...values, productId: product.id, updatedAt: new Date() },
    );
    variantBySku.set(variantSeed.sku, { ...variant, productName: product.name });

    const imageUrl =
      VARIANT_IMAGE_SEEDS[variantSeed.sku] ??
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80";
    const existingVariantImage = await db.query.variantImages.findFirst({
      where: and(
        eq(schema.variantImages.variantId, variant.id),
        eq(schema.variantImages.imageUrl, imageUrl),
      ),
    });

    if (!existingVariantImage) {
      await db.insert(schema.variantImages).values({
        variantId: variant.id,
        imageUrl,
        displayOrder: 1,
        isPrimary: true,
      });
    }

    const existingCostHistory = await db.query.costPriceHistory.findFirst({
      where: and(
        eq(schema.costPriceHistory.variantId, variant.id),
        eq(schema.costPriceHistory.costPrice, variantSeed.costPrice),
      ),
    });

    if (!existingCostHistory) {
      await db.insert(schema.costPriceHistory).values({
        variantId: variant.id,
        costPrice: variantSeed.costPrice,
        note: `Initial cost for ${variantSeed.sku}`,
        createdBy: adminProfile.id,
      });
    }
  }

  const primaryProduct = productBySlug.get("premium-coffee");
  const primaryVariant = variantBySku.get("COF-250G");
  if (!primaryProduct || !primaryVariant) {
    throw new Error("Missing primary product/variant for seed data.");
  }

  if (customerProfile) {
    console.log("  → Orders");
    const order = await upsertById(
      schema.orders,
      schema.orders.id,
      () =>
        db.query.orders.findFirst({
          where: eq(schema.orders.orderNumber, "E2E-0001"),
        }),
      {
        orderNumber: "E2E-0001",
        customerId: customerProfile.id,
        status: "paid",
        subtotal: "240.00",
        discount: "0",
        total: "240.00",
        totalCost: "140.00",
        profit: "100.00",
        shippingName: "Nguyen Van A",
        shippingPhone: "0900000005",
        shippingAddress: "123 Le Loi, District 1, HCMC",
        customerNote: "Please deliver quickly",
        adminNote: "Seed order",
        paidAmount: "240.00",
        paidAt: new Date(),
        createdBy: adminProfile.id,
      },
      {
        status: "paid",
        subtotal: "240.00",
        discount: "0",
        total: "240.00",
        totalCost: "140.00",
        profit: "100.00",
        shippingName: "Nguyen Van A",
        shippingPhone: "0900000005",
        shippingAddress: "123 Le Loi, District 1, HCMC",
        customerNote: "Please deliver quickly",
        adminNote: "Seed order",
        paidAmount: "240.00",
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    );

    const existingOrderItem = await db.query.orderItems.findFirst({
      where: and(
        eq(schema.orderItems.orderId, order.id),
        eq(schema.orderItems.variantId, primaryVariant.id),
      ),
    });

    if (existingOrderItem) {
      await db
        .update(schema.orderItems)
        .set({
          quantity: 2,
          unitPrice: "120.00",
          costPriceAtOrderTime: "70.00",
          lineTotal: "240.00",
          lineCost: "140.00",
          lineProfit: "100.00",
        })
        .where(eq(schema.orderItems.id, existingOrderItem.id));
    } else {
      await db.insert(schema.orderItems).values({
        orderId: order.id,
        variantId: primaryVariant.id,
        productName: primaryProduct.name,
        variantName: primaryVariant.name,
        sku: primaryVariant.sku,
        quantity: 2,
        unitPrice: "120.00",
        costPriceAtOrderTime: "70.00",
        lineTotal: "240.00",
        lineCost: "140.00",
        lineProfit: "100.00",
      });
    }

    const existingStatusHistory = await db.query.orderStatusHistory.findFirst({
      where: and(
        eq(schema.orderStatusHistory.orderId, order.id),
        eq(schema.orderStatusHistory.status, "paid"),
      ),
    });

    if (!existingStatusHistory) {
      await db.insert(schema.orderStatusHistory).values({
        orderId: order.id,
        status: "paid",
        note: "Payment received",
        createdBy: adminProfile.id,
      });
    }

    console.log("  → Payments");
    const existingPayment = await db.query.payments.findFirst({
      where: and(eq(schema.payments.orderId, order.id), eq(schema.payments.method, "cash")),
    });

    if (existingPayment) {
      await db
        .update(schema.payments)
        .set({
          amount: "240.00",
          note: "E2E payment",
        })
        .where(eq(schema.payments.id, existingPayment.id));
    } else {
      await db.insert(schema.payments).values({
        orderId: order.id,
        amount: "240.00",
        method: "cash",
        note: "E2E payment",
        createdBy: adminProfile.id,
      });
    }

    console.log("  → Supplier Orders");
    const existingSupplierOrder = await db.query.supplierOrders.findFirst({
      where: and(
        eq(schema.supplierOrders.supplierId, supplier.id),
        eq(schema.supplierOrders.variantId, primaryVariant.id),
      ),
    });

    if (existingSupplierOrder) {
      await db
        .update(schema.supplierOrders)
        .set({
          status: "ordered",
          quantity: 20,
          actualCostPrice: "65.00",
          note: "E2E supplier order",
          orderedAt: new Date(),
          expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        })
        .where(eq(schema.supplierOrders.id, existingSupplierOrder.id));
    } else {
      await db.insert(schema.supplierOrders).values({
        supplierId: supplier.id,
        variantId: primaryVariant.id,
        status: "ordered",
        quantity: 20,
        actualCostPrice: "65.00",
        note: "E2E supplier order",
        orderedAt: new Date(),
        expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: adminProfile.id,
      });
    }

    console.log("  → Notifications");
    const existingNotification = await db.query.adminNotifications.findFirst({
      where: and(
        eq(schema.adminNotifications.type, "order_created"),
        eq(schema.adminNotifications.orderId, order.id),
      ),
    });

    if (!existingNotification) {
      await db.insert(schema.adminNotifications).values({
        type: "order_created",
        title: "New order created",
        message: "E2E order created for testing",
        orderId: order.id,
        isRead: false,
      });
    }

    console.log("  → Idempotency Keys");
    await upsertById(
      schema.idempotencyKeys,
      schema.idempotencyKeys.id,
      () =>
        db.query.idempotencyKeys.findFirst({
          where: eq(schema.idempotencyKeys.key, "e2e-order-create-0001"),
        }),
      {
        key: "e2e-order-create-0001",
        resourceType: "order",
        resourceId: order.id,
        requestPayload: JSON.stringify({
          orderNumber: "E2E-0001",
          customerId: customerProfile.id,
        }),
        responsePayload: JSON.stringify({ orderId: order.id }),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        resourceId: order.id,
        requestPayload: JSON.stringify({
          orderNumber: "E2E-0001",
          customerId: customerProfile.id,
        }),
        responsePayload: JSON.stringify({ orderId: order.id }),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    );

    console.log("  → Expenses");
    const existingExpense = await db.query.expenses.findFirst({
      where: eq(schema.expenses.description, "E2E Hosting"),
    });

    if (existingExpense) {
      await db
        .update(schema.expenses)
        .set({
          amount: "50.00",
          type: "fixed",
          updatedAt: new Date(),
        })
        .where(eq(schema.expenses.id, existingExpense.id));
    } else {
      await db.insert(schema.expenses).values({
        description: "E2E Hosting",
        amount: "50.00",
        type: "fixed",
        createdBy: adminProfile.id,
      });
    }
  } // end if (customerProfile)

  console.log("  → Reports");
  const reportDate = new Date();
  reportDate.setHours(0, 0, 0, 0);
  const reportDateString = reportDate.toISOString().slice(0, 10);

  await upsertById(
    schema.dailyReports,
    schema.dailyReports.id,
    () =>
      db.query.dailyReports.findFirst({
        where: eq(schema.dailyReports.reportDate, reportDateString),
      }),
    {
      reportDate: reportDateString,
      totalOrders: 1,
      completedOrders: 1,
      cancelledOrders: 0,
      totalRevenue: "240.00",
      totalCost: "140.00",
      totalProfit: "100.00",
      topProducts: [
        {
          variant_id: primaryVariant.id,
          name: primaryVariant.name,
          quantity: 2,
          revenue: "240.00",
        },
      ],
    },
    {
      totalOrders: 1,
      completedOrders: 1,
      cancelledOrders: 0,
      totalRevenue: "240.00",
      totalCost: "140.00",
      totalProfit: "100.00",
      topProducts: [
        {
          variant_id: primaryVariant.id,
          name: primaryVariant.name,
          quantity: 2,
          revenue: "240.00",
        },
      ],
      updatedAt: new Date(),
    },
  );

  console.log("  → System Settings");
  for (const setting of SYSTEM_SETTINGS) {
    await upsertById(
      schema.systemSettings,
      schema.systemSettings.id,
      () =>
        db.query.systemSettings.findFirst({
          where: eq(schema.systemSettings.key, setting.key),
        }),
      {
        ...setting,
      },
      {
        ...setting,
        updatedAt: new Date(),
      },
    );
  }

  console.log("✅ E2E seed complete.");
  await client.end();
}

seedE2E().catch((err) => {
  console.error("❌ E2E seed failed:", err);
  process.exit(1);
});
