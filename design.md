---
name: Rajesh Real Estate 2.0
colors:
  primary: '#CC0000'
  primary-dark: '#990000'
  primary-light: '#ff3333'
  accent-teal: '#008080'
  accent-teal-dark: '#006666'
  accent-teal-light: '#339999'
  secondary: '#FFFFFF'
  text: '#1A1A1A'
  text-muted: '#666666'
  text-light: '#999999'
  background: '#FFFFFF'
  dark: '#0A0A0A'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
  display-md:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-sm:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  2xl: 1rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
---

# Design System Specification: Rajesh Real Estate 2.0

## 1. Brand & Creative North Star: "Finding Your Legacy"
The brand identity of **Rajesh Real Estate 2.0** balances the elegance of elite residency with modern, high-tech accessibility. The North Star—**"Finding Your Legacy, One Door at a Time"**—is translated visually through a high-impact, premium aesthetic that pairs bold, authoritative primary tones with sophisticated, growth-oriented accent colors.

The user experience is designed to feel spacious, secure, and interactive, using rich micro-animations, glassmorphism, and natural depth layers.

## 2. Colors: High-Contrast Premium Palette
The color scheme leverages high contrast to demarcate different functionalities:

*   **Primary (Imperial Red - `#CC0000`):** Used for key branding elements, primary navigation highlights, and high-importance CTAs. It conveys energy, passion, and legacy.
*   **Accent (Teal - `#008080`):** Used to highlight modern features, growth, investment highlights, and interactive voice agent (Saathi) triggers.
*   **Neutral Surfaces:** A clean canvas of pure White (`#FFFFFF`) with deep Charcoal (`#1A1A1A`) typography for optimal legibility.
*   **Overlay/Muted Tones:** Uses semi-transparent glass panels (`bg-white/70`) with high backdrop blur to create physical depth without crowding the UI.

## 3. Typography: Editorial Sophistication
We pair a bold, modern geometric sans-serif for display headings with a highly legible sans-serif for content and data.

*   **Display & Headers (Outfit):** Highly stylized, modern, and expressive. Used for large hero titles and section headers to capture immediate attention.
*   **Body & Labels (Inter):** High readability, neutral structure, and optimized for data density in dashboards and listings.

## 4. Elevation & Depth: Atmospheric Glassmorphism
Instead of flat dividers, the system uses layering and glass structures to distinguish sections:

*   **Glass Panel (`.glass-panel`):** `background: rgba(255, 255, 255, 0.7)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255, 255, 255, 0.2)`. It floats on top of full-bleed imagery or background layers.
*   **Premium Shadow:** `0 10px 40px rgba(0, 0, 0, 0.08)` provides clean elevation for cards and hover states.
*   **Glass Shadow:** `0 8px 32px 0 rgba(31, 38, 135, 0.07)` offers high-diffusion depth for panels and floating menus.

## 5. Layout & Spacing
*   **Grid:** Standard 12-column layout for product grids and dashboard panels.
*   **Max Width:** Main container constrained to `1280px` (`max-w-7xl` or `container-custom`) for comfortable reading on ultra-wide desktop screens.
*   **Padding:** Section spacing is set to `py-16` (mobile) to `py-24` (desktop) to ensure layouts feel breathable and luxurious.

## 6. Key UI Components

### Floating Header
A floating bar centered at the top of the viewport. It dynamically switches from transparent (when over the Hero banner) to a frosted white glass panel (`glass-panel`) as the user scrolls, retaining the primary logo in red (`RR`) and dark text.

### Interactive Hero Section
Features a full-bleed parallax cover photo overlayed with clean text. Contains two primary buttons:
1.  **Browse Properties:** A clean white pill button that scrolls the page to property listings.
2.  **Talk to Saathi:** A semi-transparent blurred button with an active animated loading pulse representing the AI Voice Agent.

### Property Cards
Clean cards with `rounded-2xl` styling and subtle borders. Highlighting listing price, property specifications (BHK, area, layout), and tag badges for Residential/Commercial types. Includes hover scaling animations to invite interaction.

### Agency Settings & Dashboards
A comprehensive portal utilizing high-contrast lists, custom wizards (Add Property Wizard, Bulk Lead Upload), agent tracking widgets, and lead details modals. Highly organized layout patterns with distinct colored chips for lead statuses.

### Voice Agent (Saathi) Interface
An interactive assistant integration that triggers a floating conversation module. Provides real-time feedback with responsive listening indicators.
