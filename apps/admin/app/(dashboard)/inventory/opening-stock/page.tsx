import { requireRole } from "@workspace/database/lib/auth";
import { ROLE } from "@workspace/shared/constants";
import Content from "./_content";

export default async function OpeningStockPage() {
  await requireRole([ROLE.OWNER]);
  return <Content />;
}
