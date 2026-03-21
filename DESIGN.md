# K-SMART Design System

> A token-level reference for the K-SMART e-commerce platform — covering color, typography, spacing, radius, shadow, animation, and component API contracts.

---

## Philosophy

**Clean · Minimal · Professional**

The K-SMART design system targets two audiences: customers browsing the storefront and operators managing the admin dashboard. Both share one token vocabulary. Semantic names (not raw values) are the only layer that code should reference.

---

## Architecture

```
CSS Custom Properties (design tokens)
        │
        ▼
@theme inline mapping  →  Tailwind utility classes
        │
        ▼
CVA variant functions  →  Component API (variant props)
        │
        ▼
React components  →  UI
```

Tokens live in `packages/ui/src/globals.css`.
Components live in `packages/ui/src/components/`.
Utilities (`cn`, `formatCurrency`, etc.) live in `packages/shared/src/utils.ts`.

---

## 1. Color Tokens

### 1.1 Semantic Palette (Light Mode — HSL)

| Token | CSS Variable | Value | Tailwind Class | Role |
|---|---|---|---|---|
| Background | `--background` | `hsl(210 40% 98%)` | `bg-background` | Page background, Slate 50 |
| Foreground | `--foreground` | `hsl(222 47% 11%)` | `text-foreground` | Body text, Slate 900 |
| Card | `--card` | `hsl(0 0% 100%)` | `bg-card` | Card surfaces, White |
| Card Foreground | `--card-foreground` | `hsl(222 47% 11%)` | `text-card-foreground` | Text on cards |
| Popover | `--popover` | `hsl(0 0% 100%)` | `bg-popover` | Dropdown/popover background |
| Popover Foreground | `--popover-foreground` | `hsl(222 47% 11%)` | `text-popover-foreground` | Text in popovers |
| Primary | `--primary` | `hsl(222 47% 11%)` | `bg-primary` | CTA backgrounds, Slate 900 |
| Primary Foreground | `--primary-foreground` | `hsl(210 40% 98%)` | `text-primary-foreground` | Text on primary, Slate 50 |
| Secondary | `--secondary` | `hsl(0 0% 100%)` | `bg-secondary` | Secondary button bg, White |
| Secondary Foreground | `--secondary-foreground` | `hsl(215 16% 47%)` | `text-secondary-foreground` | Slate 600 |
| Muted | `--muted` | `hsl(210 40% 96.1%)` | `bg-muted` | Muted backgrounds, Slate 100 |
| Muted Foreground | `--muted-foreground` | `hsl(215 16% 47%)` | `text-muted-foreground` | Supporting text, Slate 600 |
| Accent | `--accent` | `hsl(210 40% 96.1%)` | `bg-accent` | Hover states, Slate 100 |
| Accent Foreground | `--accent-foreground` | `hsl(222 47% 11%)` | `text-accent-foreground` | Slate 900 |
| Destructive | `--destructive` | `hsl(0 84.2% 60.2%)` | `bg-destructive` | Errors, delete actions |
| Border | `--border` | `hsl(214.3 31.8% 91.4%)` | `border-border` | Dividers, Slate 200 |
| Input | `--input` | `hsl(214.3 31.8% 91.4%)` | `border-input` | Form field borders |
| Ring | `--ring` | `hsl(222 47% 11%)` | `ring-ring` | Focus rings, Slate 900 |

### 1.2 Dark Mode Overrides (OKLch)

| Token | CSS Variable | Value | Role |
|---|---|---|---|
| Background | `--background` | `oklch(0.15 0.02 260)` | Deep navy-charcoal |
| Foreground | `--foreground` | `oklch(0.98 0.01 260)` | Near-white |
| Card | `--card` | `oklch(0.18 0.02 260)` | Slightly elevated surface |
| Primary | `--primary` | `oklch(0.7 0.12 180)` | Teal/cyan accent |
| Primary Foreground | `--primary-foreground` | `oklch(0.15 0.02 180)` | Dark teal text |
| Secondary | `--secondary` | `oklch(0.25 0.03 180)` | Subtle teal tint |
| Muted | `--muted` | `oklch(0.22 0.02 260)` | Recessed surface |
| Muted Foreground | `--muted-foreground` | `oklch(0.6 0.02 260)` | Soft gray text |
| Accent | `--accent` | `oklch(0.2 0.02 190)` | Hover surface |
| Destructive | `--destructive` | `oklch(0.5 0.18 25)` | Muted red |
| Border | `--border` | `oklch(0.3 0.02 190)` | Subtle border |
| Ring | `--ring` | `oklch(0.55 0.15 190)` | Teal focus ring |

> **Why two color spaces?** HSL is intuitive for designers specifying light-mode palette values. OKLch is perceptually uniform — dark mode colors feel consistent in perceived lightness at every hue, eliminating the "some colors look bright, others look dull" problem.

### 1.3 Chart Tokens

| Token | Light Value | Usage |
|---|---|---|
| `--chart-1` | `hsl(222 47% 11%)` | Primary data series, Slate 900 |
| `--chart-2` | `hsl(215 16% 47%)` | Secondary data series, Slate 600 |
| `--chart-3` | `hsl(215 25% 27%)` | Tertiary data series, Slate 800 |
| `--chart-4` | `hsl(214 32% 91%)` | Quaternary data, Slate 200 |
| `--chart-5` | `hsl(210 40% 96%)` | Quinary data, Slate 100 |

### 1.4 Sidebar Tokens

| Token | Light Value | Dark Value |
|---|---|---|
| `--sidebar` | `hsl(0 0% 98%)` | `hsl(240 5.9% 10%)` |
| `--sidebar-foreground` | `hsl(240 5.3% 26.1%)` | `hsl(240 4.8% 95.9%)` |
| `--sidebar-primary` | `hsl(240 5.9% 10%)` | `hsl(224.3 76.3% 48%)` |
| `--sidebar-primary-foreground` | `hsl(0 0% 98%)` | `hsl(0 0% 100%)` |
| `--sidebar-accent` | `hsl(240 4.8% 95.9%)` | `hsl(240 3.7% 15.9%)` |
| `--sidebar-accent-foreground` | `hsl(240 5.9% 10%)` | `hsl(240 4.8% 95.9%)` |
| `--sidebar-border` | `hsl(220 13% 91%)` | `hsl(240 3.7% 15.9%)` |
| `--sidebar-ring` | `hsl(217.2 91.2% 59.8%)` | `hsl(217.2 91.2% 59.8%)` |

### 1.5 Status Colors (Semantic — Applied in Components)

These are applied directly via Tailwind utilities throughout the codebase, not as CSS tokens, but are conventions of the system:

| Status | Background | Text | Border | Usage |
|---|---|---|---|---|
| Success / Delivered | `bg-emerald-50` | `text-emerald-600` | `border-emerald-100` | Completed orders |
| Warning / Pending | `bg-amber-50` | `text-amber-600` | `border-amber-100` | Pending payment |
| Info / Processing | `bg-blue-50` | `text-blue-600` | `border-blue-100` | Active processing |
| Neutral / Draft | `bg-gray-50` | `text-gray-600` | `border-gray-100` | Inactive / draft |
| Error / Cancelled | `bg-red-50` | `text-red-600` | `border-red-100` | Failed, cancelled |

---

## 2. Typography Tokens

### 2.1 Font Families

| Token | CSS Variable | Value | Tailwind Class |
|---|---|---|---|
| Sans-serif | `--font-sans` | `"Inter", ui-sans-serif, system-ui, sans-serif, ...` | `font-sans` |
| Loaded via | Next.js `next/font/google` | Variable: `--font-inter` | Applied to `<body>` |

### 2.2 Type Scale (Tailwind defaults)

| Class | Size | Line Height | Usage |
|---|---|---|---|
| `text-xs` | 12px / 0.75rem | 16px / 1rem | Captions, micro labels, badge text |
| `text-sm` | 14px / 0.875rem | 20px / 1.25rem | Body small, form labels, table data |
| `text-base` | 16px / 1rem | 24px / 1.5rem | Body text, input values |
| `text-lg` | 18px / 1.125rem | 28px / 1.75rem | Section subheadings |
| `text-xl` | 20px / 1.25rem | 28px / 1.75rem | Card titles |
| `text-2xl` | 24px / 1.5rem | 32px / 2rem | Page section headings |
| `text-3xl` | 30px / 1.875rem | 36px / 2.25rem | Page titles |
| `text-4xl` | 36px / 2.25rem | 40px / 2.5rem | Hero headings |
| `text-5xl` | 48px / 3rem | 48px / 1 | Hero display text |

### 2.3 Font Weights

| Class | Value | Usage |
|---|---|---|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | UI labels, form inputs, badge text |
| `font-semibold` | 600 | Card titles, section headings |
| `font-bold` | 700 | Display headings, strong emphasis |

### 2.4 Typographic Conventions

- **Line length**: Keep prose content under `max-w-prose` (65ch)
- **Anti-aliasing**: `antialiased` applied to `<body>`
- **Selection**: `selection:bg-primary/20` for brand-consistent text selection
- **Leading**: Components use `leading-none` for tight UI labels, `leading-relaxed` for paragraph content

---

## 3. Spacing Tokens

The system uses Tailwind's default 4px base grid. Custom spacing is avoided in favor of the standard scale.

| Scale | Value | Common Usage |
|---|---|---|
| `space-0` / `p-0` | 0px | Resets |
| `space-1` / `p-1` | 4px | Micro gaps (icon badges) |
| `space-1.5` | 6px | Compact padding (xs button) |
| `space-2` / `p-2` | 8px | Tight padding (xs/sm buttons, icon spacing) |
| `space-3` / `p-3` | 12px | Small padding (sm button, input y-padding) |
| `space-4` / `p-4` | 16px | Default button padding, card gaps |
| `space-5` / `p-5` | 20px | Medium gaps |
| `space-6` / `p-6` | 24px | Card padding (x and y), section gaps |
| `space-8` / `p-8` | 32px | Large section padding |
| `space-10` | 40px | Extra-large gaps |
| `space-12` | 48px | Section vertical rhythm |
| `space-16` | 64px | Major page sections |
| `space-24` | 96px | Hero sections |

---

## 4. Border Radius Tokens

Base radius: `--radius: 0.5rem` (8px)

| Token | CSS Variable | Value | Tailwind | Computed | Usage |
|---|---|---|---|---|---|
| Small | `--radius-sm` | `calc(var(--radius) - 4px)` | `rounded-sm` | 4px | Tight UI (checkboxes, small tags) |
| Medium | `--radius-md` | `calc(var(--radius) - 2px)` | `rounded-md` | 6px | Buttons, inputs, select triggers |
| Large | `--radius-lg` | `var(--radius)` | `rounded-lg` | 8px | Default radius, cards in compact mode |
| XL | `--radius-xl` | `calc(var(--radius) + 4px)` | `rounded-xl` | 12px | Cards, select content, popovers |
| 2XL | `--radius-2xl` | `calc(var(--radius) + 8px)` | `rounded-2xl` | 16px | Large cards, modals |
| 3XL | `--radius-3xl` | `calc(var(--radius) + 12px)` | `rounded-3xl` | 20px | Floating elements |
| 4XL | `--radius-4xl` | `calc(var(--radius) + 16px)` | `rounded-4xl` | 24px | Pill-style elements |
| Full | N/A | `9999px` | `rounded-full` | ∞ | Avatars, badges, search inputs |

---

## 5. Shadow & Elevation Tokens

Elevation is communicated through shadows and background lightness, not just `z-index`.

| Level | Tailwind | Usage |
|---|---|---|
| None | `shadow-none` | Flat inline elements |
| XS | `shadow-xs` | Inputs, tight UI chrome |
| SM | `shadow-sm` | Cards, dropdowns, select triggers |
| MD | `shadow-md` | Popovers, elevated menus |
| LG | `shadow-lg` | Modals, sheets, toasts |
| XL | `shadow-xl` | Full-page overlays |

### 5.1 Glass Utilities

```css
.glass {
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-sm);
}

.glass-card {
  border: 1px solid rgba(203,213,225,0.6);  /* slate-200/60 */
  background: white;
  transition: all 300ms;
}

.glass-header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--sidebar-border);
}
```

---

## 6. Animation Tokens

Provided by `tw-animate-css` and Tailwind's built-in transitions.

### 6.1 Transition Durations

| Class | Duration | Usage |
|---|---|---|
| `duration-75` | 75ms | Micro-interactions (checkbox check) |
| `duration-150` | 150ms | Hover states |
| `duration-200` | 200ms | Button transitions |
| `duration-300` | 300ms | Panel slides, card hover |
| `duration-500` | 500ms | Skeleton shimmer |

### 6.2 Easing

| Class | Curve | Usage |
|---|---|---|
| `ease-in` | `cubic-bezier(0.4,0,1,1)` | Elements exiting |
| `ease-out` | `cubic-bezier(0,0,0.2,1)` | Elements entering |
| `ease-in-out` | `cubic-bezier(0.4,0,0.2,1)` | General transitions |

### 6.3 Entry Animations (via tw-animate-css)

| Class | Description | Usage |
|---|---|---|
| `animate-in` | Enables enter animation | Radix overlays on open |
| `animate-out` | Enables exit animation | Radix overlays on close |
| `fade-in-0` | Fade from opacity 0 | Dialog enter |
| `fade-out-0` | Fade to opacity 0 | Dialog exit |
| `zoom-in-95` | Scale from 0.95 | Popover enter |
| `zoom-out-95` | Scale to 0.95 | Popover exit |
| `slide-in-from-top-2` | Slide in from top | Dropdown from top |
| `slide-in-from-bottom-2` | Slide in from bottom | Drawer enter |

---

## 7. Component Token API

### 7.1 Button

```
variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
size:    "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"
asChild: boolean  (renders as Slot — wrap any element)
```

| Variant | Background | Text | Hover | Use Case |
|---|---|---|---|---|
| `default` | `bg-primary` | `text-primary-foreground` | `bg-primary/90` | Primary CTA |
| `destructive` | `bg-destructive` | `text-white` | `bg-destructive/90` | Delete, danger |
| `outline` | `bg-background` | inherits | `bg-accent` | Secondary action |
| `secondary` | `bg-secondary` | `text-secondary-foreground` | `bg-secondary/80` | Neutral action |
| `ghost` | transparent | inherits | `bg-accent` | Icon buttons, table actions |
| `link` | transparent | `text-primary` | underline | Inline link action |

| Size | Height | Padding | Icon Size |
|---|---|---|---|
| `xs` | 24px | px-2 | 12px |
| `sm` | 32px | px-3 | 16px |
| `default` | 36px | px-4 | 16px |
| `lg` | 40px | px-6 | 16px |
| `icon` | 36px square | — | 16px |
| `icon-xs` | 24px square | — | 12px |
| `icon-sm` | 32px square | — | 16px |
| `icon-lg` | 40px square | — | 16px |

### 7.2 Badge

```
variant: "default" | "secondary" | "destructive" | "outline"
asChild: boolean
```

Shape: `rounded-full`, `px-2 py-0.5`, `text-xs font-medium`

### 7.3 Card

Slots: `Card > CardHeader > (CardTitle + CardDescription + CardAction?) + CardContent + CardFooter`

- Base: `bg-card rounded-xl border shadow-sm py-6 gap-6`
- Header uses container queries (`@container/card-header`)
- `CardAction` positions itself in grid column 2 automatically

### 7.4 Input

- Base: `h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base md:text-sm`
- Focus: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Error: `aria-invalid:border-destructive aria-invalid:ring-destructive/20`
- File upload: native `<input type="file">` styled via `file:` prefix

### 7.5 Select

```
<Select>
  <SelectTrigger size="default | sm">
    <SelectValue placeholder="..." />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Group name</SelectLabel>
      <SelectItem value="...">Label</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

- Trigger: `rounded-xl border border-gray-100 bg-white shadow-sm`
- Content: `rounded-xl border border-gray-100 shadow-md` with entry animations
- Item: `rounded-lg py-1.5 focus:bg-accent`

### 7.6 Avatar

```
<Avatar className="size-10">
  <AvatarImage src="..." alt="..." />
  <AvatarFallback>KS</AvatarFallback>
</Avatar>
```

Default size: `size-8` (32px). Override with `size-{n}`.

### 7.7 Tabs

```
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Label</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">...</TabsContent>
</Tabs>
```

### 7.8 Dialog & AlertDialog

Dialog: for forms and informational content requiring user interaction.
AlertDialog: for destructive confirmations — requires explicit "Cancel" and "Continue" actions.

Both use `data-[state=open]:animate-in` entry animations.

### 7.9 Tooltip

```
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild><Button>Hover me</Button></TooltipTrigger>
    <TooltipContent>Helpful label</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### 7.10 Skeleton

Simple loading placeholder. Matches the shape of the content it replaces.

```
<Skeleton className="h-4 w-48" />
```

### 7.11 Switch

```
<Switch checked={value} onCheckedChange={setValue} />
```

### 7.12 Separator

```
<Separator />                         {/* horizontal */}
<Separator orientation="vertical" />  {/* vertical */}
```

### 7.13 Breadcrumb

```
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>Current</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### 7.14 Scroll Area

Replaces native `overflow-auto` to provide a styled scrollbar.

```
<ScrollArea className="h-64">
  {/* content */}
</ScrollArea>
```

### 7.15 Sheet

Side drawer. Props: `side: "left" | "right" | "top" | "bottom"`.

---

## 8. Utility Classes

| Class | Description |
|---|---|
| `.glass` | Frosted-glass surface (white/70, backdrop-blur) |
| `.glass-card` | Subtle glass card with transition |
| `.glass-header` | Sticky nav bar with glass effect |

All three support dark mode via `dark:` variants.

---

## 9. Dark Mode Implementation

Dark mode is controlled by adding the `.dark` class to the `<html>` element. The design system uses a **two-tone strategy**:

- **Light mode**: HSL values — designer-friendly, intuitive
- **Dark mode**: OKLch values — perceptually uniform, avoiding hue shifts

No JavaScript is required to switch modes — only a class change is needed. Combined with `@custom-variant dark (&:is(.dark *))`, all dark styles are co-located with their light counterparts in Tailwind.

```tsx
// Toggle dark mode
document.documentElement.classList.toggle('dark')
```

---

## 10. File Locations

| Resource | Path |
|---|---|
| Design Tokens (CSS vars) | `packages/ui/src/globals.css` |
| Tailwind @theme mapping | `packages/ui/src/globals.css` |
| All UI Components | `packages/ui/src/components/` |
| Shared Utilities | `packages/shared/src/utils.ts` |
| App-level global CSS | `apps/main/app/globals.css`, `apps/admin/app/globals.css` |
| Design System Page | `apps/main/app/design-system/page.tsx` |

---

## 11. Contributing

1. **New tokens** go in `packages/ui/src/globals.css` — both `:root` (light) and `.dark`
2. **New components** go in `packages/ui/src/components/` — follow existing CVA + Radix UI patterns
3. **Variants** are defined in the CVA `variants` object, never as one-off `className` strings
4. **Dark mode** variants are written inline: `dark:bg-slate-800` (not in separate dark blocks)
5. **Data slots** (`data-slot="..."`) are required on all component roots for styling hooks
6. Update this document when adding tokens or components
