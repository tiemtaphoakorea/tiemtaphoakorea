import { eq } from "drizzle-orm";
import { db } from "../db";
import { homepageCollections } from "../schema/homepage-collections";

const DEFAULTS = [
  {
    type: "manual" as const,
    title: "Featured",
    subtitle: null,
    iconKey: null,
    itemLimit: 5,
    sortOrder: 0,
    isActive: true,
    daysWindow: null,
    categoryId: null,
  },
  {
    type: "best_sellers" as const,
    title: "Bán chạy nhất",
    subtitle: "Sản phẩm được khách hàng chọn mua nhiều nhất",
    iconKey: "beauty",
    itemLimit: 4,
    sortOrder: 1,
    isActive: true,
    daysWindow: null,
    categoryId: null,
  },
  {
    type: "new_arrivals" as const,
    title: "Hàng mới về",
    subtitle: "Sản phẩm vừa lên kệ",
    iconKey: null,
    itemLimit: 8,
    sortOrder: 2,
    isActive: true,
    daysWindow: 30,
    categoryId: null,
  },
];

export async function seedHomepageCollections() {
  for (const data of DEFAULTS) {
    const [existing] = await db
      .select({ id: homepageCollections.id })
      .from(homepageCollections)
      .where(eq(homepageCollections.title, data.title))
      .limit(1);
    if (existing) {
      console.log(`[seed] homepage_collections "${data.title}" already exists — skip`);
      continue;
    }
    await db.insert(homepageCollections).values(data);
    console.log(`[seed] homepage_collections "${data.title}" inserted`);
  }
}

// Entry point: runs when invoked directly via tsx
// (ESM does not have `require.main === module`; this file is a run-once seed script)
seedHomepageCollections()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
