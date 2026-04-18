import { getCategories } from "@workspace/database/services/category.server";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ChatWidgetInitializer } from "@/components/store/chat-widget-initializer";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [allCategories, navCategories] = await Promise.all([
    getCategories(),
    getCategories({ navOnly: true }),
  ]);

  const categories = allCategories.filter((c) => c.isActive);

  return (
    <div className="bg-background flex min-h-screen flex-col font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary dark:text-slate-50">
      <Navbar categories={categories} navCategories={navCategories} />
      <main className="w-full flex-1">{children}</main>
      <Footer />
      <ChatWidgetInitializer />
    </div>
  );
}
