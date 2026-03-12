---
name: ui-design-tokens
description: Use when building or redesigning UI - provides standard design tokens for colors, typography, spacing, borders, shadows, dark mode, and responsive breakpoints. Apply for consistent visual language.
---

# UI Design Tokens

Standard visual language for internal tools. These tokens define the foundational design system used across all applications.

---

## Color System

### Primary Colors (Actions, Links, Focus)
Use for primary actions, links, and focus states.

```
primary-50:  #f0f9ff  (backgrounds)
primary-100: #e0f2fe  (hover backgrounds)
primary-500: #0ea5e9  (text accents)
primary-600: #0284c7  (buttons, links)
primary-700: #0369a1  (hover states)
```

**Usage:**
```html
<!-- Primary button -->
<button class="bg-primary-600 hover:bg-primary-700 text-white">

<!-- Primary link -->
<a class="text-primary-600 hover:text-primary-700">
```

### Status Colors

| Status | Light Mode | Dark Mode | Use Case |
|--------|------------|-----------|----------|
| **Success/Green** | `bg-green-50 text-green-700 border-green-200` | `bg-green-900/30 text-green-300 border-green-700` | Completed, approved, low risk |
| **Warning/Yellow** | `bg-yellow-50 text-yellow-700 border-yellow-200` | `bg-yellow-900/30 text-yellow-300 border-yellow-700` | Pending, medium priority |
| **Danger/Red** | `bg-red-50 text-red-700 border-red-200` | `bg-red-900/30 text-red-300 border-red-700` | Rejected, blocked, high risk, errors |
| **Info/Blue** | `bg-blue-50 text-blue-700 border-blue-200` | `bg-blue-900/30 text-blue-300 border-blue-700` | In progress, informational |
| **Purple** | `bg-purple-50 text-purple-700 border-purple-200` | `bg-purple-900/30 text-purple-300 border-purple-700` | Critical, admin, special |
| **Orange** | `bg-orange-100 text-orange-700` | `bg-orange-900/40 text-orange-300` | Medium risk, warnings |
| **Neutral/Gray** | `bg-gray-50 text-gray-700 border-gray-200` | `bg-gray-700 text-gray-300 border-gray-600` | Draft, inactive, default |

### Neutral Colors (Backgrounds, Borders, Text)

```
/* Backgrounds */
gray-50:  Page backgrounds (light)
gray-100: Card hover, subtle backgrounds
gray-900: Page backgrounds (dark)
gray-800: Card backgrounds (dark)
gray-700: Input backgrounds (dark), secondary backgrounds

/* Borders */
gray-100: Light dividers
gray-200: Standard borders (light)
gray-600: Borders (dark mode)
gray-700: Dividers (dark mode)

/* Text */
gray-900: Primary text (light)
gray-700: Secondary text (light)
gray-500: Helper text, placeholders
gray-400: Disabled text, icons
gray-100: Primary text (dark)
gray-300: Secondary text (dark)
gray-400: Helper text (dark)
```

---

## Typography

### Hierarchy

| Level | Classes | Use Case |
|-------|---------|----------|
| **Page Title** | `text-2xl font-bold` | Main page headings |
| **Section Title** | `text-xl font-semibold` | Card headers, major sections |
| **Card Title** | `text-lg font-semibold` | Component titles |
| **Subtitle** | `text-base font-semibold` | List item titles |
| **Body** | `text-sm` | Standard content |
| **Label** | `text-sm font-medium` | Form labels |
| **Helper** | `text-xs` | Helper text, hints |
| **Caption** | `text-xs text-gray-500` | Timestamps, metadata |

### Text Colors

```html
<!-- Primary text -->
<p class="text-gray-900 dark:text-gray-100">

<!-- Secondary text -->
<p class="text-gray-700 dark:text-gray-300">

<!-- Helper/muted text -->
<p class="text-gray-500 dark:text-gray-400">

<!-- Disabled text -->
<p class="text-gray-400 dark:text-gray-500">

<!-- Error text -->
<p class="text-red-600 dark:text-red-400">

<!-- Success text -->
<p class="text-green-600 dark:text-green-400">
```

---

## Spacing Scale

### Padding

| Size | Class | Use Case |
|------|-------|----------|
| XS | `p-2`, `px-2 py-1` | Badges, compact elements |
| SM | `p-3`, `px-3 py-2` | Inputs, small cards |
| MD | `p-4` | Standard cards, sections |
| LG | `p-6` | Large cards, main content |
| XL | `p-8` | Hero sections |

### Margins & Gaps

```
space-y-1: Tight stacking (badges, pills)
space-y-2: Compact lists
space-y-3: Form field groups
space-y-4: Standard section spacing
space-y-6: Major section breaks

gap-2: Tight grid/flex spacing
gap-3: Compact form grids
gap-4: Standard grid spacing
gap-6: Large grid spacing
```

### Standard Component Spacing

```html
<!-- Card -->
<div class="p-4 md:p-6">

<!-- Form section -->
<div class="space-y-4">

<!-- Button group -->
<div class="flex items-center space-x-3">

<!-- List items -->
<div class="divide-y divide-gray-100 dark:divide-gray-700">
```

---

## Border Radius

| Size | Class | Use Case |
|------|-------|----------|
| SM | `rounded` | Small elements |
| MD | `rounded-md` | Buttons, pagination |
| LG | `rounded-lg` | Cards, inputs, modals |
| XL | `rounded-xl` | Large cards, containers |
| Full | `rounded-full` | Avatars, pills, badges |

**Standard:** Use `rounded-lg` for most UI elements.

---

## Shadows

```html
<!-- Standard card shadow -->
<div class="shadow-sm">

<!-- Elevated card -->
<div class="shadow-md dark:shadow-xl">

<!-- Dropdown/popover -->
<div class="shadow-lg">
```

---

## Borders

### Standard Patterns

```html
<!-- Card border -->
<div class="border border-gray-200 dark:border-gray-700">

<!-- Input border -->
<input class="border border-gray-200 dark:border-gray-600">

<!-- Divider -->
<div class="border-t border-gray-100 dark:border-gray-700">

<!-- Section border -->
<div class="border-b border-gray-100 dark:border-gray-700">
```

---

## Dark Mode

### Strategy
- Use Tailwind's `dark:` prefix
- Toggle by adding `dark` class to `<html>` element
- Store preference in cookie for persistence

### Transition for Theme Switching
```css
html {
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}

body, div, section {
  transition: background-color 0.3s ease-in-out,
              border-color 0.3s ease-in-out,
              color 0.3s ease-in-out;
}

button, a {
  transition: all 0.2s ease-in-out;
}
```

### Common Dark Mode Pairs

| Element | Light | Dark |
|---------|-------|------|
| Page BG | `bg-gray-50` | `dark:bg-gray-900` |
| Card BG | `bg-white` | `dark:bg-gray-800` |
| Input BG | `bg-white` | `dark:bg-gray-700` |
| Text | `text-gray-900` | `dark:text-gray-100` |
| Secondary Text | `text-gray-700` | `dark:text-gray-300` |
| Border | `border-gray-200` | `dark:border-gray-700` |
| Input Border | `border-gray-200` | `dark:border-gray-600` |

---

## Responsive Breakpoints

| Breakpoint | Width | Use Case |
|------------|-------|----------|
| Default | < 768px | Mobile-first base styles |
| `md:` | >= 768px | Tablet, show sidebars |
| `lg:` | >= 1024px | Desktop |
| `2xl:` | >= 1536px | Wide screens, multi-column |

### Common Responsive Patterns

```html
<!-- Responsive padding -->
<main class="p-4 md:p-6 lg:px-8">

<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">

<!-- Hide on mobile -->
<div class="hidden md:block">

<!-- Show only on mobile -->
<div class="md:hidden">
```

---

## Z-Index Scale

| Layer | Value | Use Case |
|-------|-------|----------|
| Base | 0 | Normal content |
| Dropdown | 10 | Dropdowns, tooltips |
| Sticky | 20 | Sticky headers |
| Sidebar | 40 | Mobile sidebar backdrop |
| Modal Backdrop | 50 | Modal overlays |
| Modal | 50 | Modal content |
| Notification | 50 | Toast notifications |

---

## Animation Standards

### Transitions
```html
<!-- Standard transition -->
<element class="transition-colors">

<!-- All properties -->
<element class="transition-all duration-200">

<!-- Transform transitions -->
<element class="transform transition-transform duration-300">
```

### Loading Spinner
```html
<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
```

### Pulse (checking state)
```html
<div class="animate-pulse bg-gray-400 rounded-full w-2 h-2"></div>
```

---

## Icon Sizing

| Size | Class | Use Case |
|------|-------|----------|
| XS | `w-3 h-3` | Inline with small text |
| SM | `w-4 h-4` | Buttons, inputs |
| MD | `w-5 h-5` | Standard icons |
| LG | `w-6 h-6` | Navigation, headers |
| XL | `w-8 h-8` | Feature icons |

---

## CSS Custom Classes (app.css)

Define reusable component classes using `@apply`:

```css
.btn {
  @apply px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
}

.btn-secondary {
  @apply border border-gray-300 dark:border-gray-600 bg-sky-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-sky-100 dark:hover:bg-gray-600;
}

.card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-xl overflow-hidden;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-error {
  @apply text-red-500 dark:text-red-400 text-sm mt-1;
}
```
