"use client";

import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { PageFooter } from "./_components/page-footer";
import { PageHeader } from "./_components/page-header";
import { BadgesSection } from "./_components/sections/badges-section";
import { ButtonsSection } from "./_components/sections/buttons-section";
import { CardsSection } from "./_components/sections/cards-section";
import { ColorsSection } from "./_components/sections/colors-section";
import { CommandSection } from "./_components/sections/command-section";
import { DataDisplaySection } from "./_components/sections/data-display-section";
import { EffectsSection } from "./_components/sections/effects-section";
import { FormsSection } from "./_components/sections/forms-section";
import { NavigationSection } from "./_components/sections/navigation-section";
import { NumberInputSection } from "./_components/sections/number-input-section";
import { OverlaysSection } from "./_components/sections/overlays-section";
import { PaginationSection } from "./_components/sections/pagination-section";
import { QuickReferenceSection } from "./_components/sections/quick-reference-section";
import { RadiusSection } from "./_components/sections/radius-section";
import { SheetSection } from "./_components/sections/sheet-section";
import { SpacingSection } from "./_components/sections/spacing-section";
import { TableSection } from "./_components/sections/table-section";
import { TypographySection } from "./_components/sections/typography-section";
import { SidebarNav } from "./_components/sidebar-nav";

export default function DesignSystemPage() {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-slate-50 font-sans">
        <SidebarNav />

        <main className="ml-56 flex-1">
          <PageHeader />

          <div className="mx-auto max-w-5xl px-8 py-10">
            <ColorsSection />
            <TypographySection />
            <SpacingSection />
            <RadiusSection />
            <EffectsSection />
            <ButtonsSection />
            <BadgesSection />
            <CardsSection />
            <FormsSection />
            <NavigationSection />
            <DataDisplaySection />
            <TableSection />
            <OverlaysSection />
            <CommandSection />
            <SheetSection />
            <NumberInputSection />
            <PaginationSection />
            <QuickReferenceSection />
            <PageFooter />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
