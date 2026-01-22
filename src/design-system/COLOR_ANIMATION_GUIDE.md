# 🎨 Color & Animation System Guide

## Color Palette - Premium & Calm

### Primary Colors (Brand - Use Sparingly)
**Usage:** Main CTAs, primary actions, links, focus states only

- `primary-500` (#0c88e8) - Main brand color - calm, confident
- `primary-600` (#0a6bc4) - Hover state
- `primary-700` (#0d5499) - Active/pressed state

**Rules:**
- ✅ Use for primary buttons only
- ✅ Use for important links
- ✅ Use for focus rings
- ❌ Don't use for backgrounds
- ❌ Don't use for decorative elements

### Secondary Colors (Supporting Actions)
**Usage:** Secondary buttons, subtle accents

- `secondary-500` (#64748b) - Secondary actions
- `secondary-600` (#475569) - Hover state

**Rules:**
- ✅ Use for secondary buttons
- ✅ Use for subtle UI accents
- ❌ Don't use as primary color

### Neutral Grays (Layouts & Content)
**Usage:** Backgrounds, text, borders - most of the UI

- `gray-50` (#fafafa) - Lightest backgrounds
- `gray-100` (#f5f5f5) - Subtle backgrounds
- `gray-200` (#e5e5e5) - Borders, dividers
- `gray-500` (#737373) - Secondary text
- `gray-600` (#525252) - Body text
- `gray-700` (#404040) - Headings
- `gray-900` (#171717) - Darkest text

**Rules:**
- ✅ Use grays for 80% of the UI
- ✅ Use for backgrounds, text, borders
- ✅ Use for subtle UI elements

### Semantic Colors (Feedback Only)
**Usage:** Success, error, warning states - feedback only

- `success-500` (#22c55e) - Success states
- `error-500` (#ef4444) - Error states
- `warning-500` (#f59e0b) - Warning states

**Rules:**
- ✅ Use for feedback messages
- ✅ Use for validation states
- ❌ Don't use for decoration
- ❌ Don't use as primary colors

---

## Animation Principles

### Timing Rules
- **Micro-interactions:** 150ms (button press, hover)
- **Standard transitions:** 200ms (most UI elements)
- **Slightly slower:** 250ms (cards, modals)
- **Maximum:** 300ms (page transitions)

### Easing Functions
- **Standard:** `cubic-bezier(0.4, 0, 0.2, 1)` - Smooth ease-out
- **Quick response:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)` - Snappy
- **Subtle spring:** `cubic-bezier(0.34, 1.56, 0.64, 1)` - Natural feel

### Animation Types

#### 1. Fade Animations (200ms)
- `animate-fade-in` - Simple fade in
- `animate-fade-out` - Simple fade out
- `animate-fade-in-up` - Fade + slide up (8px)
- `animate-fade-in-down` - Fade + slide down (8px)

#### 2. Slide Animations (200ms)
- `animate-slide-up` - Slide up (8px)
- `animate-slide-down` - Slide down (8px)
- `animate-slide-left` - Slide left (8px)
- `animate-slide-right` - Slide right (8px)

#### 3. Scale Animations (150ms)
- `animate-scale-in` - Scale from 0.98 to 1
- `animate-scale-out` - Scale from 1 to 0.98
- `animate-scale-up` - Subtle scale pulse (1 → 1.02 → 1)

#### 4. Modal Animations (250ms)
- `animate-modal-in` - Modal entrance (scale + fade + slide)
- `animate-modal-out` - Modal exit

#### 5. Page Transitions (300ms)
- `animate-page-in` - Page fade in

#### 6. Loading States
- `animate-pulse-subtle` - Subtle pulse (2s)
- `animate-shimmer` - Shimmer effect for skeletons

---

## Component Animation Guidelines

### Buttons
```jsx
// Press feedback - Fast (150ms)
className="active:scale-[0.98] transition-transform duration-150 ease-out"

// Hover - Standard (200ms)
className="hover:bg-primary-700 transition-all duration-200 ease-out"
```

### Cards
```jsx
// Hover lift - Subtle (200ms)
className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-out"
```

### Modals
```jsx
// Entrance - Smooth (250ms)
className="animate-modal-in"
```

### Forms
```jsx
// Input focus - Fast (200ms)
className="focus:ring-2 focus:ring-primary-500 transition-all duration-200"
```

### Lists
```jsx
// Stagger animation
{items.map((item, index) => (
  <div style={staggerAnimation(index, 50)}>
    {/* Item */}
  </div>
))}
```

---

## Accessibility - Reduced Motion

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled */
  /* Transforms disabled */
  /* Transitions minimized */
}
```

**Implementation:**
- All animations check `prefersReducedMotion()` before animating
- CSS animations automatically disabled via media query
- Transforms disabled on hover states

---

## Best Practices

### ✅ DO
- Keep animations under 300ms
- Use ease-out easing
- Animate only what guides the user
- Test with reduced motion enabled
- Use subtle movements (8px max)

### ❌ DON'T
- Don't animate everything
- Don't use bouncy animations
- Don't exceed 300ms for interactions
- Don't ignore reduced motion preferences
- Don't use large transforms (>10px)

---

## Color Usage Checklist

- [ ] Primary color used only for main CTAs
- [ ] Grays used for 80% of UI
- [ ] Semantic colors used only for feedback
- [ ] No random colors
- [ ] Consistent color hierarchy

## Animation Checklist

- [ ] All animations under 300ms
- [ ] Reduced motion supported
- [ ] Subtle movements only
- [ ] Smooth easing functions
- [ ] Purposeful animations only
