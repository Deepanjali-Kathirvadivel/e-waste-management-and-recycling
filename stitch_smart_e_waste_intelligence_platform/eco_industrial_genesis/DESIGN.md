---
name: Eco-Industrial Genesis
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#404944'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#4f1f19'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b342d'
  on-tertiary-container: '#ea9e93'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4a9'
  on-tertiary-fixed: '#380d08'
  on-tertiary-fixed-variant: '#6e372f'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  emerald-deep: '#064E3B'
  forest-heavy: '#065F46'
  slate-industrial: '#334155'
  value-success: '#10B981'
  depletion-danger: '#EF4444'
  warning-amber: '#F59E0B'
  data-blue: '#0EA5E9'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is built on the philosophy of **Eco-Industrial SaaS**. It bridges the gap between raw industrial utility and sophisticated environmental stewardship. The brand personality is authoritative, precise, and data-centric, designed to instill high trust in B2B stakeholders and operational efficiency in warehouse employees.

The visual style utilizes a **Modern Corporate** foundation with **Minimalist** execution. It prioritizes information density without sacrificing clarity. Key characteristics include:
- **High-Trust Professionalism:** Rigid alignment and structured layouts that reflect the precision of Computer Vision and forecasting.
- **Sustainability through Data:** Avoiding "organic" or "soft" tropes in favor of clean lines and technical accuracy.
- **Industrial Efficiency:** High-contrast interfaces that remain legible in high-brightness environments like processing facilities.

## Colors

The palette is anchored by "Emerald Deep" and "Forest Heavy" to represent sustainability as a professional enterprise rather than a casual initiative. 

- **Primary (Emerald):** Used for primary actions, brand presence, and representing "reusability" value.
- **Secondary (Slate):** Used for technical headers, sidebars, and industrial metadata.
- **Neutral:** A crisp, cool-toned grayscale palette (Slate 50-900) ensures the interface feels like a high-end SaaS tool.
- **Semantic Colors:** 
    - **Success Green:** Indicates high reusability and positive value.
    - **Amber/Red:** Indicates waste, hazardous materials, or low recyclability.
    - **Data Blue:** Reserved for forecasting trends and neutral data visualizations.

## Typography

This design system utilizes **Inter** for its neutral, highly legible character in complex UI. For numerical data, forecasting outputs, and CV metadata, **JetBrains Mono** is introduced to provide a technical, "scanned" aesthetic that aids in tabular alignment and numerical clarity.

- **Headlines:** Bold and tight-tracking to convey authority.
- **Data Display:** All weight-bearing numbers in dashboards should use the `data-mono` style to ensure tabular figures align perfectly.
- **Labels:** Small, uppercase labels are used for category tags and metadata headers to differentiate them from actionable body text.

## Layout & Spacing

The layout utilizes a **Fixed Grid** for the Admin Dashboard to maintain dashboard widget consistency, while the Employee Operations Module uses a **Fluid Grid** to accommodate various tablet and mobile devices used during physical assessments.

- **Grid System:** A 12-column grid with a 24px gutter.
- **Spacing Scale:** A strict 4px baseline grid. All margins and paddings must be multiples of 4 (4, 8, 12, 16, 24, 32, 48, 64).
- **Responsive Behavior:** 
    - **Desktop (1280px+):** Sidebar navigation remains expanded; 3-column widget layouts.
    - **Tablet (768px - 1279px):** Sidebar collapses to icons; 2-column widget layouts.
    - **Mobile (<767px):** Single column stack; focus on CV upload and assessment buttons.

## Elevation & Depth

To maintain the "Industrial" look, this design system avoids heavy shadows, opting instead for **Tonal Layers** and **Low-Contrast Outlines**.

- **Surface Tiers:** Backgrounds use `slate-50`, while primary containers use `white`. Secondary containers (like sidebars or info-panels) use `slate-100`.
- **Borders:** Instead of shadows, use 1px borders in `slate-200` to define card boundaries.
- **Active State:** Only active or floating elements (like modals or dropdowns) receive a subtle, neutral ambient shadow (Offset: 0, 4px, Blur: 12px, Color: Slate-900 at 5% opacity).

## Shapes

The shape language is **Soft** but disciplined. 

- **Standard Radius:** 4px (0.25rem) for inputs, buttons, and small components. This maintains a sharp, professional edge.
- **Large Radius:** 8px (0.5rem) for dashboard cards and container modules.
- **Interactive Elements:** Buttons should never be fully rounded (pill); they must retain their structured 4px corners to align with the industrial aesthetic.

## Components

### Buttons & Inputs
- **Primary Action:** Solid `emerald-deep` with white text.
- **Secondary Action:** Ghost style with `slate-industrial` borders and text.
- **Inputs:** High-contrast 1px borders. Focused state uses a 2px `emerald-deep` border. Monospaced font for numerical inputs.

### CV Upload Zones
- **Visuals:** Large, dashed-border containers with a "Scanner" overlay effect. 
- **Feedback:** Real-time progress bars using `emerald-deep`. Success states should instantly shift to a "Verified" badge.

### Status Badges
- **Assessment:** Small, high-contrast badges with `label-sm` typography. 
- **Palette:** 
    - `Reusable`: Light Emerald background / Dark Emerald text.
    - `Recycle`: Light Slate background / Dark Slate text.
    - `Hazardous`: Light Red background / Dark Red text.

### Data Visualizations
- **Charts:** Use clean line graphs for forecasting and treemaps for e-waste composition. 
- **Color Mapping:** Success Green for growth in reusability; Slate for general volume; Red for depletion of value.

### Complex Forms
- Use 2-column layouts for product metadata.
- Group related fields (e.g., "Physical Condition" and "Component Integrity") into distinct, bordered sub-sections.