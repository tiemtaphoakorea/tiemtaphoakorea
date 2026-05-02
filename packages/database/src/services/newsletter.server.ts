import { eq } from "drizzle-orm";
import { db } from "../db";
import { newsletterSubscribers } from "../schema/newsletter";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SubscribeResult =
  | { ok: true; alreadySubscribed: boolean }
  | { ok: false; reason: "invalid_email" | "internal_error" };

export async function subscribeToNewsletter(
  rawEmail: string,
  source?: string,
): Promise<SubscribeResult> {
  const email = String(rawEmail ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    return { ok: false, reason: "invalid_email" };
  }

  try {
    const trimmedSource = source ? String(source).slice(0, 50) : null;

    const inserted = await db
      .insert(newsletterSubscribers)
      .values({ email, source: trimmedSource })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: { unsubscribedAt: null },
      })
      .returning({ id: newsletterSubscribers.id });

    return { ok: true, alreadySubscribed: inserted.length === 0 };
  } catch (error) {
    console.error("Newsletter subscribe failed:", error);
    return { ok: false, reason: "internal_error" };
  }
}

export async function unsubscribeFromNewsletter(rawEmail: string): Promise<boolean> {
  const email = String(rawEmail ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return false;

  await db
    .update(newsletterSubscribers)
    .set({ unsubscribedAt: new Date() })
    .where(eq(newsletterSubscribers.email, email));
  return true;
}
