# Auth Shop Admin - Design System

This document outlines the design system for the Auth Shop Admin dashboard, combining the existing "Clean Minimal" Slate foundation with modern Glassmorphism enhancements.

## 1. Visual Style: "Modern Glass Minimal"

**Keywords:** Clean, Professional, Depth, Airiness.

The design relies on a subtle separation of layers using background colors and blur effects (Glassmorphism) rather than heavy borders or drop shadows. This creates a modern, lightweight feel.

## 2. Color Palette (Slate 50-900)

Based on `globals.css`, we use a neutral, high-contrast Slate palette.

| Token          | Color     | Value (Light) | Usage                                 |
| :------------- | :-------- | :------------ | :------------------------------------ |
| **Primary**    | Slate 900 | `#0f172a`     | Main Server Actions, Active States, Headings |
| **Foreground** | Slate 900 | `#0f172a`     | Body Text                             |
| **Muted FG**   | Slate 500 | `#64748b`     | Secondary Text, Meta data             |
| **Background** | Slate 50  | `#f8fafc`     | **App Background** (The Canvas)       |
| **Surface**    | White     | `#ffffff`     | **Cards, Sidebar, Modals**            |
| **Border**     | Slate 200 | `#e2e8f0`     | Subtle Dividers                       |
| **Input**      | Slate 200 | `#e2e8f0`     | Form Fields                           |

**Dark Mode Strategy:**

- Backgrounds invert to deep Slate (950).
- Cards lighten slightly (Slate 900).
- Borders darker (Slate 800).

## 3. Depth & Layering

To avoid the "flat" look, we use a distinct Z-axis structure:

1.  **Level 0 (Canvas):** `bg-muted/40` (Slate 50). The bottom-most layer.
2.  **Level 1 (Content):** `bg-white` (Solid). Cards, tables, forms.
3.  **Level 2 (Floating):** `bg-white/80` + `backdrop-blur-md`. Sticky Headers, Floating Server Actions.

## 4. Typography

**Font:** Inter (Sans-serif)

- **Headings:** Bold / Black weights for structural anchors (e.g., "Dashboard", "K-SMART").
- **Body:** Regular (400) for readability.
- **Labels:** Medium/Semibold (500/600) for navigation and buttons.

## 5. Components & Interactions

### Sidebar

- **Background:** White (Solid) or extremely subtle gray.
- **Border:** `border-r border-border` (Subtle).
- **Active Item:** `text-primary bg-primary/5` (Soft highlight) or `text-primary font-bold`.
- **Hover:** `bg-muted` transition.

### Header / Topbar

- **Style:** Sticky, Glassmorphism.
- **Classes:** `sticky top-0 z-10 w-full bg-white/80 backdrop-blur-md border-b border-border/40`.
- **Purpose:** Context (Breadcrumbs) + Global Server Actions. Uses transparency to show content scrolling underneath.

### Buttons & Iteractions

- **Radius:** `rounded-lg` (Matches `var(--radius)`).
- **Transitions:** `transition-all duration-200 ease-in-out`.
- **Cursors:** Always `cursor-pointer` on interactive elements.

## 6. Iconography

- **Set:** Lucide React.
- **Style:** Stroke width 2px (matching typography).
- **Color:** `text-muted-foreground` (default) -> `text-primary` (active/hover).
