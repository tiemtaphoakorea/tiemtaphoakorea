---
id: DS-Foundation
type: design-system
status: active
project: Auth Shop Platform
linked-to: [[Design-MOC]]
created: 2026-01-21
tags: [design, tokens, typography, colors]
---

# Design System: Clean Minimal (Light Edition)

**Philosophy**: "Invisible Design".
Focus on content, readability, and speed. A clean whitespace-heavy interface that feels professional and trustworthy. Avoids "gamery" or "neon" effects.

**Keywords**: Clean, Crisp, airy, Professional, Light.

---

## 1. Typography (Refined)

### Primary Font: **Geist** or **Inter** (Alternative: General Sans)

Let's stick to **General Sans** (for character) or **Inter** (for absolute neutrality).
_Decision_: Keep **General Sans** for headings to maintain brand character, but use standard weights.

### Scale

- **H1**: `text-3xl font-semibold tracking-tight text-slate-900`.
- **H2**: `text-xl font-medium text-slate-900`.
- **Body**: `text-sm text-slate-600 leading-relaxed`.
- **Label**: `text-xs font-medium text-slate-500 uppercase tracking-wide`.

---

## 2. Color Palette (Light & Crisp)

**Backgrounds**:

- `bg-white`: Cards, Panels.
- `bg-slate-50/50`: App Background (Subtle separation).

**Borders**:

- `border-slate-200`: Standard structural border.
- `border-slate-100`: Subtle dividers.

**Primary Action**:

- **Black (`bg-slate-900`)**: The most premium "minimal" primary color.
- **Accents**: Subtle Blue (`text-blue-600`) for links/active states.

| Token         | Value                 | Usage            |
| ------------- | --------------------- | ---------------- |
| `--bg-app`    | `#f8fafc` (Slate 50)  | Main background  |
| `--bg-card`   | `#ffffff` (White)     | Content surfaces |
| `--text-main` | `#0f172a` (Slate 900) | Headings         |
| `--text-body` | `#475569` (Slate 600) | Paragraphs       |
| `--primary`   | `#0f172a` (Slate 900) | Primary Buttons  |
| `--border`    | `#e2e8f0` (Slate 200) | Dividers         |

---

## 3. Depth & Surfaces

Instead of "Glass Blur", we use **Crisp Borders + Soft Shadows**.

### Card Style

```css
.card {
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border-radius: 12px;
}
```

### Elevation

- **Hover**: `shadow-md` + `translate-y-[-1px]` (Subtle lift).
- **Dropdown/Modal**: `shadow-xl border border-slate-100`.

---

## 4. Components

### Buttons

- **Primary**: Solid Black (`bg-slate-900 text-white hover:bg-slate-800`).
- **Secondary**: White with Border (`bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`).
- **Ghost**: Transparent (`hover:bg-slate-100 text-slate-600`).

### Layout

- **Sidebar**: White background, right border. Minimalist nav items.
- **Header**: Transparent or White with bottom border.

---

## 5. Visual Language

- **No Gradients**: Use solid colors.
- **No Glows**: Use clearly defined borders.
- **High Contrast**: Dark text on light backgrounds.
