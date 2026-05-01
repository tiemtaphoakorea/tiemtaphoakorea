import { getCategories } from "@workspace/database/services/category.server";
import { getSetting } from "@workspace/database/services/settings.server";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Navbar } from "@/components/layout/navbar";
import { ChatWidgetInitializer } from "@/components/store/chat-widget-initializer";

type ContactWidgetConfig = { phoneNumber?: string; messengerUrl?: string };

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [allCategories, navCategories, contactConfig] = await Promise.all([
    getCategories(),
    getCategories({ navOnly: true }),
    getSetting<ContactWidgetConfig>("contact_widget_config"),
  ]);

  const categories = allCategories.filter((c) => c.isActive);

  return (
    <div className="bg-background flex min-h-screen flex-col font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <AnnouncementBar />
      <Navbar categories={categories} navCategories={navCategories} />
      <main className="w-full flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <ChatWidgetInitializer
        phoneNumber={contactConfig?.phoneNumber}
        messengerUrl={contactConfig?.messengerUrl}
      />
    </div>
  );
}
