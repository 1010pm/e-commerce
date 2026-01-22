# 🎨 Design System - Production Ready

## Color Palette

### Primary (Blue) - Trust & Professionalism
- **50**: `#f0f9ff` - Lightest background
- **100**: `#e0f2fe` - Light background
- **500**: `#0ea5e9` - Primary action
- **600**: `#0284c7` - Primary hover
- **700**: `#0369a1` - Primary active

### Secondary (Purple) - Premium & Creative
- **500**: `#d946ef` - Secondary actions
- **600**: `#c026d3` - Secondary hover

### Semantic Colors
- **Success**: Green (`#22c55e`) - Success states, confirmations
- **Error**: Red (`#ef4444`) - Errors, destructive actions
- **Warning**: Amber (`#f59e0b`) - Warnings, cautions

## Typography Scale

### Headings
- **H1**: `3rem` (48px) - Page titles
- **H2**: `2.25rem` (36px) - Section titles
- **H3**: `1.875rem` (30px) - Subsection titles
- **H4**: `1.5rem` (24px) - Card titles

### Body
- **Large**: `1.125rem` (18px) - Important text
- **Base**: `1rem` (16px) - Default body text
- **Small**: `0.875rem` (14px) - Secondary text
- **XSmall**: `0.75rem` (12px) - Labels, captions

## Spacing System

Based on 4px base unit:
- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)
- **2xl**: `3rem` (48px)
- **3xl**: `4rem` (64px)

## Border Radius

- **sm**: `0.125rem` (2px)
- **md**: `0.375rem` (6px)
- **lg**: `0.5rem` (8px)
- **xl**: `0.75rem` (12px)
- **2xl**: `1rem` (16px)
- **full**: `9999px` - Pills, circles

## Shadows

- **sm**: Subtle elevation
- **md**: Card elevation
- **lg**: Modal, dropdown
- **xl**: Large modals
- **2xl**: Maximum elevation

## Animation Principles

### Duration
- **Fast**: 200ms - Micro-interactions
- **Normal**: 300-400ms - Standard transitions
- **Slow**: 500-600ms - Page transitions

### Easing
- **ease-out**: Default (cubic-bezier(0.4, 0, 0.2, 1))
- **bounce-in**: Playful (cubic-bezier(0.68, -0.55, 0.265, 1.55))
- **smooth**: Fluid (cubic-bezier(0.4, 0, 0.2, 1))

### Usage Rules
1. **Purposeful**: Every animation serves a purpose
2. **Fast**: Never block the user (max 400ms for interactions)
3. **Consistent**: Use same timing for similar actions
4. **Respectful**: Honor `prefers-reduced-motion`

## Component Guidelines

### Buttons
- **Primary**: Blue gradient, white text
- **Secondary**: Gray background
- **Outline**: Border, transparent background
- **Ghost**: No background, text only
- **Danger**: Red gradient

### Cards
- **Elevation**: Subtle shadow on hover
- **Hover**: Lift effect (-translate-y-1)
- **Border**: Light gray border
- **Radius**: `xl` (12px)

### Inputs
- **Focus**: Primary ring (2px)
- **Error**: Red border + error message
- **Disabled**: Gray background, reduced opacity

## Accessibility

### Contrast Ratios
- **Text on background**: Minimum 4.5:1
- **Large text**: Minimum 3:1
- **Interactive elements**: Minimum 3:1

### Focus States
- **Visible**: 2px primary ring
- **Offset**: 2px from element
- **Keyboard**: Full keyboard navigation support

### Motion
- **Respect**: `prefers-reduced-motion`
- **Alternative**: Static states for reduced motion

## Dark Mode

### Color Mapping
- **Light backgrounds** → Dark backgrounds
- **Dark text** → Light text
- **Shadows** → Lighter shadows in dark mode

### Implementation
- Use `dark:` prefix in Tailwind
- Test contrast in both modes
- Provide toggle in settings
