import { getInternalUser } from "@workspace/database/lib/auth";
import { redirect } from "next/navigation";
import Content from "./_content";

export default async function AdminLoginPage() {
  const user = await getInternalUser();
  if (user) redirect("/");

  return <Content />;
}
