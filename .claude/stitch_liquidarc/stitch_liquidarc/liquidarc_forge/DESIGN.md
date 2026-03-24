# Design System Specification: The Kinetic Vault

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Vault."** In the volatile world of DeFi, users seek the paradox of liquid movement combined with impenetrable security. This system rejects the "SaaS-template" look in favor of a high-end editorial experience that feels both institutional and avant-garde.

We achieve this through **Intentional Asymmetry** and **Chromatic Depth**. Rather than relying on rigid grids and boxed-in sections, we use overlapping glass layers, radical typography scales, and "light-leaks" (radial glows) to guide the eye. This is not just a dashboard; it is a premium financial instrument.

---

## 2. Colors & Surface Logic
The palette is rooted in a deep, oceanic navy to provide a sense of vastness and stability, punctuated by a hyper-luminescent Teal accent that signifies "active" energy.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or layout containment. Boundaries must be defined through:
1.  **Tonal Shifts:** Placing a `surface-container-high` card on a `surface` background.
2.  **Negative Space:** Using the Spacing Scale to create "breathing" gutters.
3.  **Backdrop Blurs:** Using the glassmorphism effect to separate floating elements from the base layer.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent materials.
*   **Base Layer:** `surface` (#0a141d). The foundation.
*   **Secondary Level:** `surface-container-low` (#131c26). Used for sidebar backgrounds or secondary content areas.
*   **Interactive Level:** `surface-container-high` (#212b35). Used for primary cards and data modules.
*   **Elevated Level:** `surface-container-highest` (#2c3640). Used for modals or tooltips that sit atop the interactive level.

### The "Glass & Gradient" Rule
To elevate the experience, apply a `backdrop-filter: blur(20px)` to all elevated surfaces. For primary actions and hero moments, use subtle radial gradients transitioning from `primary` (#70ffe1) to `primary-container` (#00e5c4) at a 45-degree angle. This adds "soul" to the data, moving away from flat, lifeless color blocks.

---

## 3. Typography: The Editorial Edge
The typographic system utilizes a "High-Contrast Pairing" to balance brutalist authority with technical precision.

*   **Display & Headlines (Syne 700/800):** These are our "Statement" tokens. Use `display-lg` for portfolio totals and `headline-md` for section titles. Syne’s wide stance and unusual terminals provide an architectural, premium feel.
*   **UI Labels & Body (Geist Sans):** This is the workhorse. It provides a clean, neutral balance to the expressive headlines. Use `label-md` for all navigation and button text.
*   **Data & Statistics (Geist Mono):** DeFi is a game of numbers. Use Geist Mono for wallet addresses, transaction hashes, and token balances. The monospaced nature ensures that ticking numbers don't "jump" or flicker during live updates.

---

## 4. Elevation & Depth
We eschew traditional drop shadows for **Tonal Layering** and **Ambient Glows.**

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` input field nested within a `surface-container-high` card creates a "sunken" effect, implying a place for data entry without needing a shadow.
*   **Ambient Shadows:** When a modal must float, use a wide-spread shadow (blur: 40px) with the color `on-secondary-fixed` at 8% opacity. This mimics natural light reflecting off a dark surface.
*   **The "Ghost Border" Fallback:** If a container requires a boundary (e.g., a card in a dense data grid), use the `outline-variant` token at 10-20% opacity. It should be felt, not seen.
*   **Signature Glows:** Place a `200px` radial gradient of `primary` at 5% opacity behind key CTA areas to create a "halo" effect, drawing the user's focus through light rather than structure.

---

## 5. Primitive Components

### Buttons
*   **Primary:** Background: `primary-container`. Text: `on-primary-container` (Geist Sans Bold). 
    *   *Interaction:* On hover, shift to `primary-fixed-dim`. Add a subtle `primary` outer glow.
*   **Secondary (Ghost):** Border: `outline-variant` at 20%. Text: `primary`. 
*   **Tertiary:** No background. Text: `on-surface-variant`. Used for "Cancel" or "Back" actions.

### Data Cards
*   **Style:** Forbid the use of divider lines. Separate "Header," "Body," and "Footer" of a card using a vertical 1.5 spacing unit (0.3rem) or a subtle background shift to `surface-bright`.
*   **Padding:** Always use `spacing-6` (1.3rem) for internal card padding to maintain an editorial, airy feel.

### Input Fields
*   **State:** Default background is `surface-container-lowest`. 
*   **Focus State:** The only time a high-contrast border is allowed. Use `primary` at 1px width with a 2px outer "glow" of the same color at 20% opacity.

### Scrollbar (The Signature)
*   Width: 5px.
*   Track: `transparent`.
*   Thumb: `primary-container` (#00e5c4).
*   Radius: `full`.

### Additional DeFi Components
*   **The "Pulse" Indicator:** For live price feeds, use a 4px circle of `tertiary` (#80ffc7) with a CSS ripple animation to indicate real-time connectivity.
*   **Address Chips:** Use `surface-container-highest` with Geist Mono text. On click, trigger a "copied" state that briefly changes the background to `primary`.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `Geist Mono` for all numerical values. Consistency in digit width is non-negotiable for financial legibility.
*   **Do** leverage the `0.5` (0.1rem) spacing unit for micro-adjustments in data-dense tables.
*   **Do** use `secondary-fixed-dim` for "de-emphasized" text rather than just lowering the opacity of white.

### Don't
*   **Don't** use pure white (#FFFFFF). The brightest text should be `on-surface` (#dae3f1) to prevent eye strain in dark mode.
*   **Don't** use standard 12px/16px sizing. Follow the Spacing Scale (e.g., 0.9rem, 1.1rem) to ensure the layout feels custom-built.
*   **Don't** stack more than three levels of glass. It muddies the background and breaks the "Kinetic Vault" clarity.