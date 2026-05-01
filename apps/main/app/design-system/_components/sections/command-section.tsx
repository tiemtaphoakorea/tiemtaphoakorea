import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@workspace/ui/components/command";
import { Bell, LogOut, Package, ShoppingCart, User } from "lucide-react";
import { commandTokens } from "../../_data/quick-reference";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";
import { TokenPill } from "../token-pill";

export function CommandSection() {
  return (
    <>
      <SectionHeader
        num="13"
        id="command"
        title="Command"
        desc="cmdk-powered command palette. Inline or inside CommandDialog (modal). Supports groups, keyboard shortcuts, and empty states."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <ShowcaseBox title="inline-command">
          <Command className="rounded-xl border border-border shadow-sm">
            <CommandInput placeholder="Search commands…" />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Products">
                <CommandItem>
                  <Package className="size-4" />
                  New Product
                </CommandItem>
                <CommandItem>
                  <ShoppingCart className="size-4" />
                  View Orders
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Account">
                <CommandItem>
                  <User className="size-4" />
                  Profile Settings
                </CommandItem>
                <CommandItem>
                  <Bell className="size-4" />
                  Notifications
                </CommandItem>
                <CommandItem className="text-destructive data-[selected=true]:text-destructive">
                  <LogOut className="size-4" />
                  Sign Out
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </ShowcaseBox>

        <ShowcaseBox title="command-description">
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              The <TokenPill value="Command" /> component wraps <TokenPill value="cmdk" /> to
              provide a fully accessible command palette with fuzzy search, keyboard navigation, and
              group organization.
            </p>
            <div className="space-y-1.5">
              {commandTokens.map(([name, desc]) => (
                <div key={name} className="flex items-center gap-2">
                  <TokenPill value={name} />
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </ShowcaseBox>
      </div>
    </>
  );
}
