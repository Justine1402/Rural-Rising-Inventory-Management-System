# RURIIMS Design System
## Based on the official Rural Rising Philippines brand template

---

## Color Palette

| Name         | Hex       | Tailwind Approx     | Usage                              |
|--------------|-----------|---------------------|------------------------------------|
| Gold         | #FAA31A   | yellow-400/500      | Headings, accents, highlights      |
| Dark Green   | #1A381E   | (use inline style)  | Navbar, page headers, primary BG   |
| White        | #FFFFFF   | white               | Cards, text on dark backgrounds    |
| Medium Green | #409645   | (use inline style)  | Buttons, active tabs               |
| Light Green  | #489F46   | (use inline style)  | Secondary elements                 |
| Deep Green   | #39803E   | (use inline style)  | Hover states, borders              |

For colors not covered by Tailwind defaults, use inline `style={{ backgroundColor: '#1A381E' }}`.

---

## Typography

- **Display/Brand headings:** The Foregen (Rough One) — used for "RURAL RISING" logo text only
- **UI headings:** The Foregen (Regular) — section titles, page headers
- **Body/UI text:** Apercu — all body copy, labels, table text, buttons

> Note: If The Foregen and Apercu are not available as web fonts, substitute with:
> - Headings → `font-bold tracking-wide uppercase`
> - Body → default Tailwind sans (Inter/system font)

---

## Design Principles

- Dark green (`#1A381E`) navbar, always full width
- Gold (`#FAA31A`) used for brand name and key accents — never as a background for large areas
- Buttons: Medium green (`#409645`) background, white text, rounded corners
- Cards: White background, subtle shadow, rounded corners
- Page background: Light gray (`#F3F4F6` / `bg-gray-100`)
- Tables: Dark green header row with white text; alternating white rows
- Status badges: Green pill for active/in-stock, red pill for inactive/out-of-stock

---

## What to Avoid

- Do not use generic blue (Tailwind default) anywhere
- Do not use `bg-green-700` or `bg-green-900` — use inline hex values for accuracy
- Do not mix the gold color into backgrounds or large UI surfaces