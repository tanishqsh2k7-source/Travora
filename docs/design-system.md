# Travora Design System

> An editorial travel magazine aesthetic crossed with a modern booking experience. Warm paper tones, refined serif typography, high-contrast ink text, and tactile interactive surfaces.

---

## 1. Core Principles

1. **Editorial & Human:** We speak like a discerning travel publication, not an AI demo. Warm typography, spacious editorial layouts, and authentic photography take center stage.
2. **Clear & Direct:** No sparkles, no floating badges, no tech jargon. Travel planning should feel calm, purposeful, and trustworthy.
3. **High Contrast & Accessible:** Meets WCAG 2.1 AA across every surface (minimum 4.5:1 for body copy, 3:1 for large text and interactive boundaries). Every interactive control has a minimum 44px hit target and an unmistakable focus ring.
4. **Light Theme Only:** A tactile, printed-paper feel rooted in warm bone-white, terracotta accents, deep teal details, and dark ink type.

---

## 2. Color Palette

| Token | Hex | Role & Usage |
|---|---|---|
| `--color-paper` | `#F7F3EC` | Global page background (warm paper) |
| `--color-surface` | `#FFFFFF` | Card & popover surface (crisp white) |
| `--color-surface-muted` | `#EFE9DF` | Subdued surfaces, tags, active item backgrounds |
| `--color-hairline` | `#E4DDD0` | 1px borders, subtle separators |
| `--color-ink` | `#14213D` | Primary headings, prominent body text (minimum 12:1 on paper) |
| `--color-muted` | `#5B6472` | Secondary descriptions, captions, labels (5.2:1 contrast) |
| `--color-terracotta` | `#C2410C` | Primary brand accent, primary CTA buttons |
| `--color-terracotta-hover` | `#9A3412` | Darker terracotta for button hover / pressed state |
| `--color-teal` | `#0E7490` | Secondary interactive color, links, tab accents, focus rings |
| `--color-teal-hover` | `#155E75` | Darker teal for hover states |
| `--color-success` | `#1F7A4D` | Confirmed bookings, free cancellation indicators, badges |
| `--color-warning` | `#8A5A00` | Advisories, weather alerts, flexible dates |
| `--color-danger` | `#B42318` | Error states, validation alerts |

---

## 3. Typography

- **Headlines:** `Fraunces, Georgia, serif` (Weight: 600, tight tracking on headings > 24px).
- **Body & Controls:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` (Weights: 400 Regular, 500 Medium, 600 SemiBold).
- **Font Display:** `font-display: swap`.

### Type Scale

| Name | Size | Line Height | Tracking | Weight | Used For |
|---|---|---|---|---|---|
| `display-1` | `64px` (`4rem`) | `1.1` | `-0.025em` | 600 (Fraunces) | Hero headline on desktop |
| `display-2` | `44px` (`2.75rem`)| `1.15` | `-0.02em` | 600 (Fraunces) | Hero mobile & section titles |
| `h1` | `32px` (`2rem`) | `1.25` | `-0.015em` | 600 (Fraunces) | Primary card titles, modal titles |
| `h2` | `24px` (`1.5rem`)| `1.3` | `-0.01em` | 600 (Fraunces) | Subsection headings |
| `h3` | `20px` (`1.25rem`)| `1.35` | `0` | 600 (Inter) | Component titles, card headers |
| `body-lg` | `18px` (`1.125rem`)| `1.5` | `0` | 400 / 500 (Inter) | Hero subhead, lead paragraph |
| `body-base`| `16px` (`1rem`) | `1.5` | `0` | 400 / 500 (Inter) | Primary body copy, inputs, buttons |
| `body-sm` | `14px` (`0.875rem`)| `1.45` | `+0.01em` | 500 / 600 (Inter) | Labels, chips, captions, table cells |

---

## 4. Spacing & Grid

- **Base Unit:** `4px`
- **Scale:** `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`, `80px`, `96px`
- **Max Content Width:** `1200px` (with `24px` horizontal padding on mobile, `40px` on desktop)
- **Section Padding:**
  - Desktop: `96px` vertical padding
  - Mobile: `56px` vertical padding

---

## 5. Shape, Border & Elevation

- **Borders:** Crisp `1px solid var(--color-hairline)` (`#E4DDD0`).
- **Radii:**
  - Small: `8px` (`--radius-sm`) – Inputs, buttons, chips, badges
  - Medium: `12px` (`--radius-md`) – Popovers, compact cards
  - Large: `20px` (`--radius-lg`) – Planner card, destination tiles, hero scrim
  - Full: `9999px` (`--radius-pill`) – Pills, chips, counter badges
- **Elevation:** Single subtle shadow:
  - `--shadow-card: 0 4px 20px -2px rgba(20, 33, 61, 0.06), 0 2px 6px -1px rgba(20, 33, 61, 0.04)`
  - Elevated Popovers: `0 12px 32px -4px rgba(20, 33, 61, 0.12), 0 4px 12px -2px rgba(20, 33, 61, 0.06)`

---

## 6. Accessibility & Interaction

- **Focus Ring:** Every interactive component displays an unmistakable `3px solid var(--color-teal)` outline with `2px` offset.
- **Touch Target:** Minimum `44px` height/width on all touchable elements.
- **Reduced Motion:** When `prefers-reduced-motion: reduce` is enabled, all non-essential scale drift, spring transforms, and crossfades are neutralized to instant state transitions.

---

## 7. Component Library Inventory

1. **Button:** Primary (terracotta), Secondary (white surface with hairline border), Ghost (text-only with teal underline on hover). Sizes: `sm` (36px desktop / 44px mobile touch area), `md` (44px), `lg` (52px). Supports loading spinner state.
2. **IconButton:** Square 44px touch target with clean line icon and aria-label.
3. **Chip:** Toggle chip with subtle fill and checkmark icon when selected (no plus signs).
4. **Field:** Accessible wrapper coupling label, hint text, form control, and inline error.
5. **Stepper:** Accessible increment/decrement control with tactile buttons and numeric output.
6. **DateRangePicker:** Integrated calendar popover displaying two calendar months on desktop (one on mobile), live night count ('6 nights'), and human-readable format ('Sat 10 Apr to Thu 15 Apr').
7. **TravellerPopover:** Popover for adults, children, and room configuration.
8. **Card:** Clean surface card with 1px hairline border, subtle elevation, and hover lift.
9. **SectionHeading:** Editorial section title (Fraunces) paired with descriptive subhead.
10. **Badge:** Small editorial status pill (success, warning, demo, length of stay).
11. **Photo:** Responsive picture element with AVIF/WebP srcset, explicit width/height, lazy loading, and warm fallback gradient.
12. **Skeleton:** Shimmer placeholder matching layout bounds during data fetch.
