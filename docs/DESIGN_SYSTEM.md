# Azarvis design system (v2, 2026-11-19)

One set of tokens for the signed-in app (`frontend/src/styles.css`, last block "design system v2"),
the public website (`frontend/src/public.css`, last block) and the static content pages
(`frontend/seo/render.js`). Use the variables, never raw colors.

## Color

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#080B14` | `#F5F7FC` | Page background |
| `--bg-2` | `#0D1322` | `#EDF2FA` | Secondary background, sidebar (dark) |
| `--surface` / `--panel-solid` | `#121B2D` | `#FFFFFF` | Cards |
| `--surface-2` | `#18243A` | `#EDF2FA` | Raised areas inside cards, hover fills |
| `--accent` | `#00D4FF` | `#087EAA` | Primary actions, links, focus |
| `--on-accent` | `#04121A` | `#FFFFFF` | Text on `--accent` (cyan needs dark text for contrast) |
| `--violet` | `#8067FF` | `#6851D9` | Secondary accent |
| `--ok` / `--warn` / `--danger` | `#22C58B` / `#F5B942` / `#FF5263` | `#16875D` / `#B87912` / `#D83F51` | Status only |
| `--text` / `--muted` | `#F4F7FF` / `#A4B0C4` | `#142033` / `#637087` | Text |
| `--border` | `#26344B` | `#DCE4EF` | Lines and card edges |

## Type
- `--font-sans`: Inter (body 14–16px, labels 12–13px)
- `--font-display`: Space Grotesk (h1–h3; page titles 30–36px, section titles 20–24px)
- `--font-mono`: JetBrains Mono (code, generated passwords, technical metadata 11–12px)

## Spacing and shape
- 4px scale: `--space-1` (4) `-2` (8) `-3` (12) `-4` (16) `-5` (20) `-6` (24) `-8` (32) `-10` (40) `-12` (48) `-16` (64)
- Radii: `--radius-sm` 8 · `--radius-md` 12 (default `--radius`) · `--radius-lg` 18 (cards) · `--radius-xl` 24 (hero panels)

## Components
- **Buttons:** one filled primary per view (`.btn.primary`: solid `--accent`), outlined or text for the rest. No gradients on buttons.
- **Website navbar:** `.snav` (PublicSite.jsx): text links with an underline for the active section, theme, Sign in, outlined Try demo, filled Get started.
- **App top bar:** breadcrumb + page title, global search, system status pill (real `/api/health`), Room Watch, theme, notifications, account.
- **Cards:** `--surface`, `1px --border`, `--radius-lg`, `--space-5` padding (see `SecurityCenter.css` as the reference).
- **Status:** a dot or icon in `--ok` / `--warn` / `--danger`, always with text; never color alone.
- **Motion:** short (150–250 ms) transitions; every animation stops under `prefers-reduced-motion`.
