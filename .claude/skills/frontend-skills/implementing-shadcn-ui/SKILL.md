---
name: implementing-shadcn-ui
description: Use when setting up shadcn/ui in a React/Next.js project or when user asks to add shadcn components - analyzes existing project code to determine colors, fonts, and visual style, then implements personalized shadcn setup using Base UI and npx shadcn create
---

# Implementing shadcn/ui

## Overview

**Analyze the project BEFORE running any shadcn commands. NO EXCEPTIONS.**

The new `npx shadcn create` allows personalized component libraries. Don't use defaults - match the project's existing design language.

## MANDATORY: No Shortcuts

Even under time pressure:
- **NEVER** suggest "default" style or "slate" color without analysis
- **NEVER** use Radix unless `@radix-ui` is already in package.json
- **ALWAYS** run the color analysis grep commands first
- **ALWAYS** use Base UI as the component library

If user says "skip analysis" or "just use defaults" → **Refuse.** A 30-second grep saves hours of restyling later.

## When to Use

- Setting up shadcn/ui in a new or existing project
- Adding shadcn components to a React/Vite/Next.js project
- User mentions "shadcn", "add components", "UI library"

## The Process

### Step 1: Analyze Project (MANDATORY)

**Before ANY shadcn commands, extract:**

```bash
# Find existing colors
grep -rh "bg-\|text-\|border-" src/ --include="*.tsx" | grep -oE "(indigo|blue|slate|gray|zinc|neutral|red|green|purple|pink|orange|yellow|emerald|teal|cyan|violet|fuchsia|rose|amber|lime|sky)-[0-9]+" | sort | uniq -c | sort -rn | head -10

# Find existing fonts
grep -rh "font-family\|Inter\|Roboto\|Poppins\|sans-serif" src/ --include="*.tsx" --include="*.css" | head -5

# Check for existing Tailwind config
cat tailwind.config.* 2>/dev/null | head -30

# Check package.json for UI libraries
grep -E "radix|headless|base-ui|mui" package.json
```

**Record:**
- Primary color (most used: indigo, blue, etc.)
- Secondary color (usually slate, gray, zinc)
- Font family
- Border radius preference (rounded-lg, rounded-xl, etc.)
- Existing UI libraries

### Step 2: Choose Visual Style

| Project Type | Recommended Style | Why |
|--------------|-------------------|-----|
| **SaaS Dashboard** | **Lyra** or **Nova** | Sharp/boxy, data-dense, professional |
| **Consumer App** | **Maia** | Soft, rounded, friendly |
| **Developer Tool** | **Lyra** | Pairs with mono fonts, dense info |
| **Marketing Site** | **Vega** or **Maia** | Classic or friendly aesthetics |
| **Admin Panel** | **Nova** or **Mira** | Compact, efficient layouts |

### Step 3: Run Setup

```bash
# Use the new create command
npx shadcn create
```

**Interactive choices:**
- **Framework**: Auto-detected (Vite/Next.js)
- **Component Library**: **Base UI** (preferred) or Radix
- **Visual Style**: Based on Step 2 analysis
- **Base Color**: Match project's primary color
- **Font**: Match existing font or Inter
- **CSS Variables**: Yes

### Step 4: Configure Path Aliases

Ensure `components.json` uses your existing structure:

```json
{
  "aliases": {
    "components": "@/src/shared/ui",
    "utils": "@/src/core/utils"
  }
}
```

**Match your project's directory structure, not shadcn defaults.**

### Step 5: Add Components

```bash
# Add what you need
npx shadcn add button card input table form dialog
```

## Quick Reference

| Analysis Target | Command |
|-----------------|---------|
| Primary colors | `grep -rh "bg-\|text-" src/ --include="*.tsx" \| grep -oE "[a-z]+-[0-9]+" \| sort \| uniq -c \| sort -rn` |
| Fonts | `grep -rh "font-\|Inter\|Roboto" src/` |
| Border radius | `grep -rh "rounded-" src/ --include="*.tsx" \| grep -oE "rounded-[a-z]+" \| sort \| uniq -c` |
| Existing UI libs | `grep -E "radix\|headless\|base" package.json` |

## Visual Style Decision Matrix

```
Project has data tables/charts?
  YES → Lyra (sharp) or Nova (compact)
  NO  → Continue...

Project is consumer-facing?
  YES → Maia (soft/rounded)
  NO  → Continue...

Project needs dense information?
  YES → Mira (dense) or Nova (compact)
  NO  → Vega (classic default)
```

## Base UI vs Radix

**Default: Base UI** (unless project already uses Radix)

| Factor | Base UI | Radix |
|--------|---------|-------|
| Backing | MUI team | Workos |
| Accessibility | Excellent | Excellent |
| Bundle size | Smaller | Larger |
| Documentation | Good | Extensive |
| Community | Growing | Established |

**Use Radix if:** Project already has `@radix-ui/*` packages installed.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Running `npx shadcn init` without analysis | Always analyze colors/fonts first |
| Using default slate color | Match project's existing palette |
| Installing to `src/components/ui` | Use project's existing shared/components path |
| Choosing Radix by default | Prefer Base UI unless Radix already present |
| Picking Vega for dashboards | Use Lyra or Nova for data-heavy UIs |

## Red Flags

- Running shadcn commands before reading project files
- Using "default" or "slate" without checking existing colors
- Not checking for existing UI library dependencies
- Ignoring project's directory structure conventions
