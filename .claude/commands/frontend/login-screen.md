---
name: login-screen
description: Use when building login/register screens for web apps. Creates a premium split-screen layout with animated WebGL mesh gradient (paper.design), enterprise form styling, and login/register toggle. Works with React + TailwindCSS.
---

# Login Screen — Split-Screen with Animated Shader

Build a premium, enterprise-grade login/register page with an animated WebGL shader background and polished form UI. Based on the battle-tested pattern from MM Wealth AI.

## When to Use

- Building a new login/register page for a React + TailwindCSS project
- Adding authentication UI to an existing app
- Redesigning a login screen to look more premium/enterprise
- User mentions "login page", "auth screen", "sign-in page", "split-screen login"

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│  Full viewport (min-h-screen flex)                    │
│                                                       │
│  ┌─────────────────┐  ┌───────────────────────────┐  │
│  │  LEFT PANEL      │  │  RIGHT PANEL              │  │
│  │  (hidden on      │  │  (always visible)         │  │
│  │   mobile)        │  │                           │  │
│  │                  │  │  ┌─────────────────────┐  │  │
│  │  WebGL Shader    │  │  │  Mobile Logo        │  │  │
│  │  (MeshGradient)  │  │  │  (lg:hidden)        │  │  │
│  │       +          │  │  └─────────────────────┘  │  │
│  │  Dark Overlay    │  │  ┌─────────────────────┐  │  │
│  │       +          │  │  │  Form Card          │  │  │
│  │  Branding (z-10) │  │  │  - Title            │  │  │
│  │  - Logo (top)    │  │  │  - Error banner     │  │  │
│  │  - Headline (mid)│  │  │  - Input fields     │  │  │
│  │  - Copyright     │  │  │  - Submit button    │  │  │
│  │    (bottom)      │  │  │  - Toggle link      │  │  │
│  │                  │  │  └─────────────────────┘  │  │
│  └─────────────────┘  └───────────────────────────┘  │
│    w-1/2 (lg+)            flex-1                      │
└──────────────────────────────────────────────────────┘
```

## Prerequisites

### 1. Install the shader package

```bash
npm install @paper-design/shaders-react
```

This installs both `@paper-design/shaders-react` (React wrapper) and `@paper-design/shaders` (vanilla WebGL engine + GLSL shaders).

### 2. Icon library (optional but recommended)

```bash
npm install lucide-react
```

Used for `Eye`, `EyeOff` (password toggle) and `ArrowRight` (submit button).

## Implementation Steps

### Step 1: Define Design Tokens

The login page relies on a semantic color system. Define these in your TailwindCSS config (v4 `@theme` or v3 `extend.colors`):

```css
/* TailwindCSS v4 — index.css */
@import "tailwindcss";

@theme {
  /* Primary — dark navy (used for left panel bg + buttons) */
  --color-primary: #0A1628;
  --color-primary-light: #132039;

  /* Accent — gold (used for highlights, links, CTA accents) */
  --color-accent: #D4A853;
  --color-accent-hover: #C49A47;

  /* Surfaces */
  --color-surface: #FFFFFF;
  --color-surface-muted: #F8F9FC;

  /* Borders */
  --color-border: #E5E7EB;

  /* Text */
  --color-text-primary: #1A1A2E;
  --color-text-secondary: #6B7280;
  --color-text-muted: #9CA3AF;

  /* Status */
  --color-danger: #DC2626;
  --color-danger-light: #FEE2E2;

  /* Fonts */
  --font-display: "DM Sans", sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
}
```

**Adapt these tokens to your brand.** The shader colors (Step 2) should harmonize with your primary/accent palette.

### Step 2: MeshGradient Shader Configuration

The `MeshGradient` component from `@paper-design/shaders-react` renders a real-time WebGL2 fragment shader. It creates animated, organically morphing color blobs.

```jsx
import { MeshGradient } from "@paper-design/shaders-react";

<MeshGradient
  colors={["#0a1628", "#1a3a5c", "#0d9488", "#c4b57a"]}
  speed={0.12}
  distortion={0.4}
  swirl={0.6}
  style={{
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  }}
/>
```

#### Props Reference

| Prop | Type | Description | Recommended |
|------|------|-------------|-------------|
| `colors` | `string[]` | 2-10 hex colors. These become the animated blob colors. | 4 colors that match your brand palette |
| `speed` | `number` | Animation speed. Higher = faster. | `0.12` for large panels, `0.4-0.6` for small cards |
| `distortion` | `number` | UV coordinate warping intensity. | `0.3-0.5` for subtle, organic motion |
| `swirl` | `number` | Radial rotation from center. | `0.4-0.7` for visible swirl without chaos |

#### Color Selection Guide

Pick 4 colors that create depth:
1. **Darkest** — matches your `primary` color (e.g., `#0a1628`)
2. **Mid-dark** — a lighter shade of primary (e.g., `#1a3a5c`)
3. **Vibrant** — a brand color for visual interest (e.g., `#0d9488` teal)
4. **Warm accent** — your accent/gold for warmth (e.g., `#c4b57a`)

#### Speed Scaling Rule

Speed is relative to visible area. A value of `0.12` on a full-panel (50vw) login looks smooth and ambient. The same speed on a small dashboard card (300px) is imperceptible. Scale up for smaller containers:

| Container Size | Recommended Speed |
|---------------|-------------------|
| Full panel (login page) | `0.10 - 0.15` |
| Large card (hero, banner) | `0.20 - 0.35` |
| Small card (dashboard widget) | `0.40 - 0.60` |

### Step 3: Container Pattern

The shader needs a specific DOM structure:

```jsx
{/* Container: relative + overflow-hidden clips canvas to rounded corners */}
<div className="relative overflow-hidden">

  {/* 1. Shader: absolutely positioned, fills container */}
  <MeshGradient
    colors={[...]}
    speed={0.12}
    distortion={0.4}
    swirl={0.6}
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
  />

  {/* 2. Dark overlay: ensures text readability over animated colors */}
  <div className="absolute inset-0 bg-primary/40" />

  {/* 3. Content: z-10 to sit above shader + overlay */}
  <div className="relative z-10">
    {/* Your content here */}
  </div>
</div>
```

**Critical rules:**
- Parent MUST have `relative overflow-hidden`
- Shader fills with `position: absolute; inset: 0`
- Dark overlay (`bg-primary/40`) goes between shader and content — adjust opacity for your palette
- Content needs `relative z-10`
- The shader creates a `<canvas>` element with `z-index: -1` internally

### Step 4: Full Login Page Structure

```jsx
import { useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await yourRegisterFn(email, password, fullName);
      } else {
        await yourLoginFn(email, password);
      }
      // Navigate to dashboard
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-primary">
      {/* ====== LEFT PANEL — Shader + Branding (desktop only) ====== */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <MeshGradient
          colors={["#0a1628", "#1a3a5c", "#0d9488", "#c4b57a"]}
          speed={0.12}
          distortion={0.4}
          swirl={0.6}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
        <div className="absolute inset-0 bg-primary/40" />

        {/* Logo — top */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <span className="text-accent font-bold text-lg">AB</span>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Your App</p>
            <p className="text-white/50 text-xs">by Your Company</p>
          </div>
        </div>

        {/* Headline — center */}
        <div className="relative z-10">
          <p className="text-accent text-sm font-semibold tracking-wide uppercase mb-3">
            Your Tagline Here
          </p>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight font-display">
            Your Main
            <br />
            Headline Goes
            <br />
            <span className="text-accent">Right Here</span>
          </h1>
          <p className="mt-6 text-white/60 text-lg max-w-md leading-relaxed">
            A brief description of what your platform does. Keep it to 2-3 lines
            for maximum impact.
          </p>
        </div>

        {/* Copyright — bottom */}
        <p className="relative z-10 text-white/30 text-xs">
          &copy; {new Date().getFullYear()} Your Company. All rights reserved.
        </p>
      </div>

      {/* ====== RIGHT PANEL — Form ====== */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-surface-muted">
        <div className="w-full max-w-md">
          {/* Mobile logo (hidden on desktop where left panel shows it) */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-accent font-bold text-lg">AB</span>
            </div>
            <div>
              <p className="text-text-primary font-bold text-lg leading-tight">Your App</p>
              <p className="text-text-muted text-xs">by Your Company</p>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-text-primary font-display">
              {isRegister ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-text-secondary text-sm mt-1.5">
              {isRegister ? "Get started for free" : "Sign in to continue"}
            </p>

            {/* Error banner */}
            {error && (
              <div className="mt-4 px-4 py-2.5 rounded-lg bg-danger-light text-danger text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Full name (register only) */}
              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    autoComplete="name"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
              </div>

              {/* Password with show/hide toggle */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    className="w-full px-4 py-2.5 pr-11 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isRegister ? "Create Account" : "Sign In"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle login/register */}
            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsRegister(!isRegister); setError(""); }}
                className="text-sm text-text-secondary hover:text-accent transition-colors"
              >
                {isRegister
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Create one"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Reusing the Shader on Other Components

The shader can be applied to any container — hero sections, portfolio cards, pricing cards, etc. Follow the container pattern from Step 3:

```jsx
{/* Example: Dashboard hero card */}
<div className="relative overflow-hidden rounded-2xl p-6 text-white">
  <MeshGradient
    colors={["#0a1628", "#1a3a5c", "#0d9488", "#c4b57a"]}
    speed={0.5}   /* Higher for small cards */
    distortion={0.4}
    swirl={0.6}
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
  />
  <div className="absolute inset-0 bg-primary/40" />
  <div className="relative z-10">
    <h3>Your Content</h3>
  </div>
</div>
```

## Technical Notes

- **WebGL2 required** — works in all modern browsers. No fallback needed (98%+ coverage).
- **GPU-rendered** — zero CPU animation cost. The shader runs entirely on the GPU.
- **Auto-pauses** when tab is hidden (uses `requestAnimationFrame` + Page Visibility API).
- **DPI-aware** — targets 2x pixel ratio with a configurable max pixel budget to cap GPU load.
- **Canvas cleanup** — `ShaderMount` disposes WebGL context on unmount. No memory leaks.
- **Mobile** — left panel is `hidden lg:flex`, so the shader doesn't render on mobile. The form takes full width with a compact mobile logo instead.

## Input Styling Pattern

All inputs use this consistent class string:

```
w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-sm
text-text-primary placeholder-text-muted
focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
transition-colors
```

Key points:
- `rounded-lg` (8px) — not `rounded-full`, keeps it professional
- `focus:ring-accent/30` — subtle gold ring on focus, not a harsh blue
- `py-2.5` — comfortable touch target (40px total height)
- `transition-colors` — smooth border/ring transitions

## Customization Checklist

When adapting to a new project, update these:

- [ ] `colors` array in `MeshGradient` — match your brand palette (4 colors)
- [ ] Logo initials + app name + company name (appears in 2 places: left panel + mobile)
- [ ] Headline text + tagline + description on left panel
- [ ] Color tokens in `@theme` (primary, accent, surfaces, text, borders)
- [ ] Font families (`--font-display`, `--font-body`)
- [ ] `handleSubmit` — wire to your auth API
- [ ] Copyright year and company name
- [ ] Add OAuth buttons (Google, GitHub) below the form if needed
- [ ] Add "Forgot password?" link if your auth supports it
