---
name: enterprise-ui
description: Use when building enterprise-grade fintech, banking, or SaaS interfaces. Provides battle-tested patterns from premium enterprise sites (Hazel.ai, Centrue, The Kingdom Bank) for layouts, dashboards, navigation, color systems, and component architecture.
---

# Enterprise UI Patterns

Design system distilled from analyzing premium enterprise fintech/banking sites: Hazel.ai, Centrue.com, and The Kingdom Bank. Use these patterns to build interfaces that feel institutional-grade, trustworthy, and polished.

---

## Core Design Principles

1. **Trust through restraint** - Enterprise users need confidence, not flash. White space communicates stability.
2. **Bold typography hierarchy** - Large headings (48-72px) with clear label/heading/body/CTA stacking.
3. **Accent color discipline** - One dominant accent color. Never more than two. The rest is neutral.
4. **Section rhythm** - Alternate light/dark backgrounds. Each section is a self-contained story.
5. **Social proof density** - Badges, awards, partner logos, compliance seals. Layer trust signals everywhere.

---

## Color Systems

### Enterprise Fintech Palettes

**Palette A: "Institutional Blue" (Centrue-style)**
```css
:root {
  --accent: #2323FF;         /* Bold blue - headings, CTAs */
  --accent-hover: #1A1ACC;
  --accent-light: #EEF0FF;   /* Section backgrounds */
  --surface: #FFFFFF;
  --surface-muted: #F8F9FC;
  --text-primary: #1A1A2E;
  --text-secondary: #6B7280;
  --text-on-accent: #FFFFFF;
  --footer-bg: #2323FF;      /* Bold colored footer */
  --footer-text: #FFFFFF;
  --border: #E5E7EB;
}
```

**Palette B: "Premium Neutral" (Hazel-style)**
```css
:root {
  --accent: #5B5BFF;         /* Blue-purple for links, chips */
  --surface: #FFFFFF;
  --surface-dark: #000000;   /* Dark section backgrounds */
  --text-primary: #000000;
  --text-secondary: #6B7280;
  --text-on-dark: #FFFFFF;
  --card-bg: #F5F5F5;        /* Light gray cards */
  --cta-bg: #000000;         /* Black pill CTAs */
  --cta-text: #FFFFFF;
  --border: #E5E7EB;
}
```

**Palette C: "Banking Red" (Kingdom Bank-style)**
```css
:root {
  --accent: #E53935;         /* Red - CTAs, highlights */
  --accent-hover: #C62828;
  --surface: #FFFFFF;
  --surface-dark: #1A1A1A;   /* Dark product sections */
  --surface-accent: #E53935; /* Red section backgrounds */
  --text-primary: #1A1A2E;
  --text-secondary: #6B7280;
  --text-on-dark: #FFFFFF;
  --text-on-accent: #FFFFFF;
  --footer-bg: #111111;
  --border: #E5E7EB;
}
```

### Status Colors (Universal)
```css
--success: #16A34A;    /* Approved, completed, deposits */
--warning: #F59E0B;    /* Pending, processing */
--danger: #DC2626;     /* Rejected, overdue, errors */
--info: #2563EB;       /* In progress, informational */
```

---

## Typography System

### Font Stacks
```css
/* Headings - choose ONE distinctive sans-serif */
--font-display: 'Plus Jakarta Sans', 'DM Sans', 'Outfit', sans-serif;

/* Body */
--font-body: 'Inter', 'DM Sans', system-ui, sans-serif;

/* Monospace (data, codes, IBANs) */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Scale

| Level | Size | Weight | Use |
|-------|------|--------|-----|
| Hero | 56-72px | 800 | Landing page hero text |
| H1 | 40-48px | 700 | Section headings |
| H2 | 28-32px | 700 | Card/feature headings |
| H3 | 20-24px | 600 | Subsection titles |
| Section Label | 14-16px | 600 | Red/blue accent label above heading |
| Body | 16-18px | 400 | Paragraph text |
| Small | 14px | 400 | Table cells, metadata |
| Caption | 12px | 500 | Timestamps, helper text |

### Section Label + Heading Pattern
Every content section follows this stack:

```html
<!-- Accent-colored label above heading -->
<p class="text-sm font-semibold text-[--accent] mb-2 tracking-wide uppercase">
  Discover the essentials
</p>
<h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
  One Platform for All Banking Needs
</h2>
<p class="text-lg text-gray-500 max-w-2xl">
  Supporting description text that explains the value proposition.
</p>
```

---

## Page Layout Architecture

### Landing Page Section Rhythm
Enterprise landing pages alternate between these section types:

```
[Nav Bar - sticky, minimal]
[Hero - full viewport, bold heading, dual CTAs]
[Partner Logo Strip - horizontal scroll]
[Features - tabbed or accordion with mockup]
[Stats/Numbers - large typography with icons]
[Product Section - dark bg, text + device mockup]
[Product Section - accent bg, text + device mockup]
[Testimonial - quote on accent background]
[CTA Banner - heading + dual buttons]
[Compliance Badges - trust seals row]
[Footer - dark, multi-column]
```

### Section Spacing
```css
section {
  padding: 80px 0;     /* Desktop */
  padding: 48px 0;     /* Mobile */
}

.section-content {
  max-width: 1140px;   /* Content container */
  margin: 0 auto;
  padding: 0 24px;
}
```

---

## Navigation

### Top Navigation Bar
```html
<nav class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2">
      <img src="/logo.svg" class="h-8" alt="Logo" />
      <span class="font-bold text-lg">Brand</span>
    </a>

    <!-- Center nav links (desktop) -->
    <div class="hidden md:flex items-center gap-8">
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
        Products
        <svg class="inline w-4 h-4 ml-0.5"><!-- chevron --></svg>
      </a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900">Security</a>
    </div>

    <!-- Right CTAs -->
    <div class="flex items-center gap-3">
      <a href="#" class="text-sm font-medium text-[--accent] border border-[--accent] rounded-lg px-4 py-2 hover:bg-[--accent-light] transition-colors">
        Log In
      </a>
      <a href="#" class="text-sm font-medium text-white bg-[--accent] rounded-lg px-4 py-2 hover:opacity-90 transition-colors">
        Get Started
      </a>
    </div>
  </div>
</nav>
```

### Dashboard Sidebar Navigation
```html
<aside class="w-64 bg-[--accent] text-white flex flex-col h-screen">
  <!-- Logo -->
  <div class="px-6 py-5 border-b border-white/10">
    <img src="/logo-white.svg" class="h-8" alt="Logo" />
  </div>

  <!-- Nav items -->
  <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
    <!-- Active item -->
    <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/15 text-white font-medium text-sm">
      <svg class="w-5 h-5"><!-- icon --></svg>
      Dashboard
    </a>
    <!-- Inactive item -->
    <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white text-sm transition-colors">
      <svg class="w-5 h-5"><!-- icon --></svg>
      Transactions
    </a>
  </nav>

  <!-- Bottom section -->
  <div class="px-3 py-4 border-t border-white/10">
    <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-white/70 hover:text-white text-sm">
      <svg class="w-5 h-5"><!-- icon --></svg>
      Support
    </a>
  </div>
</aside>
```

---

## Hero Section

### Full-Viewport Hero with Dual CTAs
```html
<section class="relative min-h-screen flex items-center bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
  <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
    <!-- Text column -->
    <div>
      <h1 class="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight">
        Your Digital
        <span class="text-[--accent]">Banking</span>
        Manager
      </h1>
      <p class="mt-6 text-lg text-gray-500 max-w-lg">
        Simplify global payments and financial operations.
        Unlock new opportunities and grow without limits.
      </p>
      <!-- Dual CTA pattern: Primary filled + Secondary outlined -->
      <div class="mt-8 flex flex-wrap gap-4">
        <a href="#" class="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-[--accent] rounded-lg hover:opacity-90 transition-all shadow-lg shadow-[--accent]/25">
          Get Started
        </a>
        <a href="#" class="inline-flex items-center px-6 py-3 text-sm font-semibold text-[--accent] border-2 border-[--accent] rounded-lg hover:bg-[--accent-light] transition-colors">
          Contact Sales
          <svg class="w-4 h-4 ml-1.5"><!-- arrow --></svg>
        </a>
      </div>
      <!-- App store badges -->
      <div class="mt-6 flex gap-3">
        <img src="/app-store.svg" class="h-10" alt="App Store" />
        <img src="/google-play.svg" class="h-10" alt="Google Play" />
      </div>
    </div>

    <!-- Visual column - product mockup or 3D render -->
    <div class="relative">
      <div class="bg-white rounded-2xl shadow-2xl p-1 transform rotate-1 hover:rotate-0 transition-transform duration-500">
        <img src="/dashboard-preview.png" class="rounded-xl" alt="Product" />
      </div>
    </div>
  </div>
</section>
```

---

## Dashboard Components

### Balance/Metric Card
```html
<div class="bg-white rounded-xl border border-gray-200 p-6">
  <p class="text-sm text-gray-500 font-medium">Total Balance</p>
  <p class="text-3xl font-bold text-gray-900 mt-1">$32,500</p>
  <div class="mt-3 flex items-center gap-4 text-sm">
    <div>
      <span class="text-gray-500">Available</span>
      <span class="font-semibold text-gray-900 ml-1">$22,000</span>
    </div>
    <div>
      <span class="text-gray-500">Reserves</span>
      <span class="font-semibold text-gray-900 ml-1">$5,000</span>
    </div>
  </div>
</div>
```

### KPI Stat Card Row
```html
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
        <svg class="w-4 h-4 text-blue-600"><!-- icon --></svg>
      </div>
      <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Invoices</span>
    </div>
    <p class="text-2xl font-bold text-gray-900 mt-3">$6,500</p>
    <p class="text-xs text-red-500 mt-1 flex items-center gap-1">
      <svg class="w-3 h-3"><!-- arrow down --></svg>
      2% from target
    </p>
  </div>
  <!-- Repeat for other KPIs -->
</div>
```

### Money In / Money Out Pair
```html
<div class="grid grid-cols-2 gap-4">
  <div class="bg-white rounded-xl border border-gray-200 p-5 text-center">
    <p class="text-sm text-gray-500">Money In</p>
    <p class="text-2xl font-bold text-green-600 mt-1">$4,500</p>
    <button class="mt-3 w-full py-2 bg-[--accent] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors">
      Add money
    </button>
  </div>
  <div class="bg-white rounded-xl border border-gray-200 p-5 text-center">
    <p class="text-sm text-gray-500">Money Out</p>
    <p class="text-2xl font-bold text-gray-900 mt-1">$1,500</p>
    <button class="mt-3 w-full py-2 border-2 border-[--accent] text-[--accent] text-sm font-medium rounded-lg hover:bg-[--accent-light] transition-colors">
      Send money
    </button>
  </div>
</div>
```

### Transaction List
```html
<div class="bg-white rounded-xl border border-gray-200">
  <div class="px-5 py-4 border-b border-gray-100">
    <h3 class="font-semibold text-gray-900">Recent Transactions</h3>
  </div>
  <div class="divide-y divide-gray-100">
    <div class="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
      <div>
        <p class="text-sm font-medium text-gray-900">Bank of America</p>
        <p class="text-xs text-gray-500 mt-0.5">External Deposit</p>
      </div>
      <span class="text-sm font-semibold text-green-600">+$22,000</span>
    </div>
    <div class="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
      <div>
        <p class="text-sm font-medium text-gray-900">Bank of America</p>
        <p class="text-xs text-gray-500 mt-0.5">Withdrawal</p>
      </div>
      <span class="text-sm font-semibold text-gray-900">-$250</span>
    </div>
  </div>
</div>
```

---

## Feature Presentation Patterns

### Numbered Feature List with Mockup
```html
<section class="py-20 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <p class="text-sm font-semibold text-[--accent] mb-2">Discover the essentials</p>
    <h2 class="text-4xl font-bold text-gray-900 mb-12">One Platform for All Needs</h2>

    <div class="grid md:grid-cols-2 gap-16 items-start">
      <!-- Feature list -->
      <div class="space-y-0">
        <!-- Active item (expanded) -->
        <div class="py-5 border-b-2 border-[--accent]">
          <div class="flex items-baseline gap-3">
            <span class="text-sm text-gray-400 font-mono">01</span>
            <h3 class="text-lg font-bold text-gray-900">Accept & Send Payments Globally</h3>
          </div>
          <p class="text-sm text-gray-500 mt-2 ml-8">
            Manage your money worldwide, spend and get paid in different currencies.
          </p>
        </div>
        <!-- Inactive item (collapsed) -->
        <div class="py-5 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
          <div class="flex items-baseline gap-3">
            <span class="text-sm text-gray-400 font-mono">02</span>
            <h3 class="text-base font-medium text-gray-600">Multi-Currency Bank Account</h3>
          </div>
        </div>
        <!-- More items... -->
      </div>

      <!-- Product mockup -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <!-- Dashboard/product screenshot -->
      </div>
    </div>
  </div>
</section>
```

### Accordion Feature List with Icons
```html
<div class="space-y-0 max-w-lg">
  <!-- Expanded -->
  <div class="border-b border-gray-200">
    <button class="w-full py-5 flex items-center justify-between text-left">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <svg class="w-4 h-4 text-[--accent]"><!-- icon --></svg>
        </div>
        <span class="font-semibold text-gray-900">Business Accounts</span>
      </div>
      <svg class="w-5 h-5 text-gray-400 rotate-180"><!-- minus/chevron --></svg>
    </button>
    <p class="pb-5 text-sm text-gray-500 pl-11">
      All-in-one business accounts to collect, manage, and move money globally.
    </p>
  </div>
  <!-- Collapsed -->
  <div class="border-b border-gray-200">
    <button class="w-full py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
          <svg class="w-4 h-4 text-purple-600"><!-- icon --></svg>
        </div>
        <span class="font-medium text-gray-700">Payments</span>
      </div>
      <svg class="w-5 h-5 text-gray-400"><!-- plus/chevron --></svg>
    </button>
  </div>
</div>
```

### Industry Filter Chips
```html
<div class="flex flex-wrap gap-3 justify-center">
  <!-- Active chip -->
  <button class="px-5 py-2.5 text-sm font-medium text-white bg-[--accent] rounded-full transition-all">
    Banks
  </button>
  <!-- Inactive chip -->
  <button class="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:border-[--accent] hover:text-[--accent] transition-all">
    Enterprises
  </button>
  <button class="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:border-[--accent] hover:text-[--accent] transition-all">
    Fintech
  </button>
</div>
```

### Tabbed Feature Section with Progress
```html
<div class="max-w-4xl mx-auto">
  <h2 class="text-4xl font-bold text-center mb-10">Transform your workflow</h2>

  <!-- Tab bar with progress indicators -->
  <div class="grid grid-cols-4 gap-0 mb-8">
    <!-- Active tab -->
    <button class="pb-3 border-b-2 border-gray-900 text-sm font-semibold text-gray-900">
      Prioritize your day
    </button>
    <!-- Inactive tabs -->
    <button class="pb-3 border-b-2 border-gray-200 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
      Capture details
    </button>
    <button class="pb-3 border-b-2 border-gray-200 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
      Follow up
    </button>
    <button class="pb-3 border-b-2 border-gray-200 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
      Answer anything
    </button>
  </div>

  <!-- Tab content -->
  <div class="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8">
    <!-- Product UI preview -->
  </div>
</div>
```

---

## Trust & Social Proof

### Partner Logo Strip
```html
<section class="py-12 border-y border-gray-100">
  <p class="text-center text-sm text-gray-400 font-medium mb-8 tracking-wide uppercase">
    Powering you with partnerships from
  </p>
  <div class="flex items-center justify-center gap-12 flex-wrap opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
    <img src="/logo-visa.svg" class="h-8" alt="Visa" />
    <img src="/logo-swift.svg" class="h-8" alt="SWIFT" />
    <img src="/logo-mastercard.svg" class="h-8" alt="Mastercard" />
    <img src="/logo-sepa.svg" class="h-8" alt="SEPA" />
    <img src="/logo-aws.svg" class="h-8" alt="AWS" />
    <img src="/logo-google.svg" class="h-8" alt="Google" />
  </div>
</section>
```

### Compliance Badge Row
```html
<div class="flex items-center justify-center gap-8 py-8">
  <div class="flex flex-col items-center gap-2">
    <img src="/badge-iso27001.svg" class="h-16 w-16" alt="ISO 27001" />
    <span class="text-xs text-gray-400">ISO 27001</span>
  </div>
  <div class="flex flex-col items-center gap-2">
    <img src="/badge-pci.svg" class="h-16 w-16" alt="PCI DSS" />
    <span class="text-xs text-gray-400">PCI DSS</span>
  </div>
  <div class="flex flex-col items-center gap-2">
    <img src="/badge-gdpr.svg" class="h-16 w-16" alt="EU GDPR" />
    <span class="text-xs text-gray-400">GDPR</span>
  </div>
  <div class="flex flex-col items-center gap-2">
    <img src="/badge-dora.svg" class="h-16 w-16" alt="DORA" />
    <span class="text-xs text-gray-400">DORA</span>
  </div>
</div>
```

### Award Badges Strip
```html
<div class="flex items-center justify-center gap-8 py-6 flex-wrap">
  <div class="text-center">
    <p class="text-[10px] text-gray-400 uppercase">Crypto Expo Dubai</p>
    <p class="text-xs font-bold text-gray-600 uppercase tracking-wide">Best International Fintech Banking Award 2021</p>
  </div>
  <!-- Repeat for each award -->
</div>
```

### Testimonial Block
```html
<section class="py-20">
  <div class="max-w-3xl mx-auto px-6">
    <div class="bg-[--accent] rounded-2xl p-10 md:p-14 text-white">
      <div class="w-full h-0.5 bg-white/20 mb-8"></div>
      <blockquote class="text-2xl md:text-3xl font-bold leading-relaxed">
        &ldquo;This changed the way we show up for clients.
        Meeting prep is faster, and the follow up is sharper.&rdquo;
      </blockquote>
      <div class="mt-8">
        <p class="font-bold">Jane Smith, CFP</p>
        <p class="text-sm text-white/70">President & CEO, Wealth Advisory</p>
      </div>
    </div>
  </div>
</section>
```

### Stats Section with Icons
```html
<section class="py-20 bg-white">
  <div class="max-w-5xl mx-auto px-6 space-y-12">
    <!-- Stat row -->
    <div class="flex items-center gap-6 flex-wrap">
      <!-- Currency/country circles -->
      <div class="flex -space-x-2">
        <div class="w-14 h-14 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-xl">&#x1F1EC;&#x1F1E7;</div>
        <div class="w-14 h-14 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-xl">&#x1F1EA;&#x1F1FA;</div>
        <div class="w-14 h-14 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-xl">&#x1F1FA;&#x1F1F8;</div>
      </div>
      <div>
        <p class="text-5xl font-bold text-gray-200">60+</p>
        <p class="text-3xl font-bold text-gray-200">Currencies</p>
      </div>
    </div>
  </div>
</section>
```

---

## Dark Product Sections

### Dark Background Feature Block
```html
<section class="bg-gray-900 text-white py-20">
  <div class="max-w-7xl mx-auto px-6">
    <!-- Product label -->
    <div class="flex items-center gap-2 mb-12">
      <svg class="w-5 h-5 text-white/60"><!-- icon --></svg>
      <span class="text-sm font-semibold text-white/80">Kingdom Cash</span>
    </div>

    <div class="grid md:grid-cols-2 gap-16 items-center">
      <div>
        <p class="text-sm text-gray-400 font-medium mb-2">Easy. Instant. Safe.</p>
        <h2 class="text-4xl md:text-5xl font-bold">
          Shop Globally,<br/>Pay Privately.
        </h2>
        <p class="text-gray-400 mt-4 max-w-md">
          Instant, hassle-free payments at a wide range of online merchants.
        </p>
        <div class="mt-8 flex gap-4">
          <a href="#" class="px-6 py-3 bg-[--accent] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-colors">
            Get Started
          </a>
          <a href="#" class="px-6 py-3 border border-[--accent] text-[--accent] text-sm font-semibold rounded-lg hover:bg-[--accent]/10 transition-colors">
            Learn More
          </a>
        </div>
      </div>

      <!-- Phone mockup -->
      <div class="flex justify-center">
        <div class="relative w-72">
          <div class="bg-white rounded-[2.5rem] p-3 shadow-2xl">
            <div class="bg-gray-100 rounded-[2rem] overflow-hidden">
              <img src="/app-screen.png" alt="App" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

### Accent Background Section (Red/Blue)
```html
<section class="relative py-20 overflow-hidden" style="background: linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 80%, black) 100%);">
  <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
    <div class="text-white">
      <p class="text-sm text-white/70 mb-2">With The Platform</p>
      <h2 class="text-4xl md:text-5xl font-bold">Complete Expense Management</h2>
      <p class="text-white/70 mt-4 max-w-md">
        Helping you to track, manage, and analyse your company's expenses.
      </p>
    </div>
    <div class="flex justify-center">
      <!-- Laptop mockup -->
      <div class="bg-gray-800 rounded-t-xl p-1 shadow-2xl max-w-md">
        <div class="bg-white rounded-t-lg overflow-hidden">
          <img src="/expense-dashboard.png" alt="Dashboard" />
        </div>
      </div>
    </div>
  </div>
</section>
```

---

## CTA Sections

### Pre-Footer CTA Banner
```html
<section class="py-16 bg-gray-50">
  <div class="max-w-4xl mx-auto px-6">
    <div class="bg-white rounded-2xl border border-gray-200 p-10 flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <p class="text-xs font-medium text-[--accent] mb-1 uppercase tracking-wide">Discover your solution</p>
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900">
          Ready to see what we can do for you?
        </h2>
      </div>
      <div class="flex gap-3 shrink-0">
        <a href="#" class="px-6 py-3 bg-[--accent] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-colors">
          Get a demo
        </a>
        <a href="#" class="px-6 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          Try for free
          <svg class="inline w-4 h-4 ml-1"><!-- chevron --></svg>
        </a>
      </div>
    </div>
  </div>
</section>
```

### Two-Card Split CTA
```html
<div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
  <!-- Accent card -->
  <a href="#" class="group relative rounded-2xl overflow-hidden p-10 min-h-[280px] flex flex-col justify-end"
     style="background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, black));">
    <p class="text-sm text-white/70">High-Net-Worth Individuals</p>
    <h3 class="text-3xl font-bold text-white mt-1 group-hover:translate-x-1 transition-transform">
      Private Banking
    </h3>
  </a>
  <!-- Dark card -->
  <a href="#" class="group relative rounded-2xl overflow-hidden p-10 min-h-[280px] flex flex-col justify-end bg-gray-900">
    <p class="text-sm text-gray-400">Businesses from All Scales</p>
    <h3 class="text-3xl font-bold text-white mt-1 group-hover:translate-x-1 transition-transform">
      Corporate Banking
    </h3>
  </a>
</div>
```

---

## Footer

### Enterprise Multi-Column Footer
```html
<footer class="bg-gray-900 text-white">
  <div class="max-w-7xl mx-auto px-6 py-16">
    <div class="grid grid-cols-2 md:grid-cols-5 gap-8">
      <!-- Logo column -->
      <div class="col-span-2 md:col-span-1">
        <img src="/logo-white.svg" class="h-8 mb-4" alt="Logo" />
      </div>

      <!-- Link columns -->
      <div>
        <h4 class="text-sm font-semibold text-[--accent] mb-4">Company</h4>
        <ul class="space-y-3">
          <li><a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">About Us</a></li>
          <li><a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Blog</a></li>
          <li><a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Careers</a></li>
          <li><a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-sm font-semibold text-[--accent] mb-4">Banking</h4>
        <ul class="space-y-3">
          <li><a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Business Account</a></li>
          <li><a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Currency Savings</a></li>
          <li><a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Money Transfer</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-sm font-semibold text-[--accent] mb-4">Payment</h4>
        <ul class="space-y-3">
          <li><a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Currency Payments</a></li>
          <li><a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Cards</a></li>
          <li><a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Global Solutions</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-sm font-semibold text-[--accent] mb-4">Legal</h4>
        <ul class="space-y-3">
          <li><a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Terms & Conditions</a></li>
          <li><a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
          <li><a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Cookie Policy</a></li>
          <li><a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">Security</a></li>
        </ul>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
      <!-- App store + social -->
      <div class="flex items-center gap-3">
        <img src="/app-store.svg" class="h-9" alt="App Store" />
        <img src="/google-play.svg" class="h-9" alt="Google Play" />
      </div>
      <div class="flex items-center gap-4">
        <a href="#" class="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
          <svg class="w-4 h-4"><!-- linkedin --></svg>
        </a>
        <a href="#" class="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
          <svg class="w-4 h-4"><!-- twitter --></svg>
        </a>
      </div>
    </div>

    <!-- Copyright -->
    <div class="mt-8 text-center">
      <p class="text-xs text-gray-500">&copy; 2026 Company. All rights reserved.</p>
    </div>
  </div>
</footer>
```

---

## Chat / AI Input Pattern

### Floating Chat Input with Suggestion Chips
```html
<div class="max-w-2xl mx-auto mt-8">
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
    <div class="flex items-center gap-3">
      <input type="text"
             placeholder="Ask anything, do everything..."
             class="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent" />
      <button class="p-1 text-gray-400 hover:text-gray-600">
        <svg class="w-5 h-5"><!-- plus/attach --></svg>
      </button>
      <button class="w-8 h-8 bg-[--accent] rounded-full flex items-center justify-center text-white hover:opacity-90 transition-colors">
        <svg class="w-4 h-4"><!-- send arrow --></svg>
      </button>
    </div>
    <!-- Suggestion chips -->
    <div class="flex gap-2 mt-3">
      <button class="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
        Draft an email
      </button>
      <button class="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
        Prep for a meeting
      </button>
      <button class="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
        Tell me more about...
      </button>
    </div>
  </div>
</div>
```

---

## Empty States

### No Data / First-Time User
```html
<div class="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-sm mx-auto">
  <h3 class="font-semibold text-gray-900">No Transactions</h3>
  <p class="text-sm text-gray-500 mt-1">Start by making your first deposit.</p>
  <button class="mt-4 px-5 py-2.5 bg-[--accent] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-colors inline-flex items-center gap-2">
    <svg class="w-4 h-4"><!-- upload --></svg>
    Deposit
  </button>
  <p class="text-xs text-gray-400 mt-3">
    Did you know? You can manage multiple currencies with ease here!
  </p>
</div>
```

---

## Responsive Patterns

### Key Breakpoints
```
Mobile-first base    < 768px   Single column, stacked layouts
md: 768px+           Tablet    2-column grids, show sidebar
lg: 1024px+          Desktop   Full nav, wider content
xl: 1280px+          Wide      Max-width containers
```

### Container Strategy
```css
.enterprise-container {
  max-width: 1140px;   /* Content */
  margin: 0 auto;
  padding: 0 24px;
}

.enterprise-container-wide {
  max-width: 1320px;   /* Dashboard layouts */
  margin: 0 auto;
  padding: 0 24px;
}
```

---

## Anti-Patterns to Avoid

1. **Never** use generic purple gradients on white - this screams "AI-generated"
2. **Never** use more than 2 accent colors - enterprise = restraint
3. **Never** skip trust signals - compliance badges, partner logos, awards are mandatory
4. **Never** use playful rounded fonts in fintech - stick to geometric sans-serif
5. **Never** auto-play video without user consent
6. **Never** use light gray text on white backgrounds below 4.5:1 contrast
7. **Never** make CTAs the same visual weight - always have a clear primary vs secondary
8. **Never** skip the section label pattern - the small colored text above headings is the enterprise fingerprint
