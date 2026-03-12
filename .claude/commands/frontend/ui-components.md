---
name: ui-components
description: Use when implementing UI components - provides patterns for buttons, badges, form inputs, cards, lists, tables, file upload, and accessibility. Reference for component HTML/CSS structure.
---

# UI Components

Standard component library for internal tools. These patterns ensure visual consistency across all applications.

---

## Buttons

### Primary Button
Main call-to-action.

```html
<button class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  <svg class="w-4 h-4 mr-2">...</svg>
  Button Text
</button>
```

### Secondary Button
Secondary actions, cancel buttons.

```html
<button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
  Cancel
</button>
```

### Danger Button
Destructive actions.

```html
<button class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 transition-colors">
  <svg class="w-4 h-4 mr-1.5">...</svg>
  Remove
</button>
```

### Icon Button
Compact actions.

```html
<button class="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
  <svg class="w-5 h-5">...</svg>
</button>
```

### Button with Loading State

```html
<button disabled class="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
  <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
  Creating...
</button>
```

### Link-Style Button

```html
<button class="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
  <svg class="w-4 h-4 mr-2">...</svg>
  Additional Details
</button>
```

---

## Badges

### Badge Function Pattern
Centralize badge styling in a utility file:

```javascript
// Badges.js
export const getStatusBadgeClass = (status) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded text-xs font-medium';
  switch (status) {
    case 'approved':
    case 'completed':
      return `${baseClasses} bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700`;
    case 'pending':
    case 'in_progress':
      return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700`;
    case 'rejected':
    case 'blocked':
      return `${baseClasses} bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700`;
    case 'implemented':
      return `${baseClasses} bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700`;
    case 'draft':
    default:
      return `${baseClasses} bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600`;
  }
};
```

### Priority Badges

```javascript
export const getPriorityBadgeClass = (priority) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded text-xs font-medium';
  switch (priority?.toLowerCase()) {
    case 'critical':
      return `${baseClasses} bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700`;
    case 'high':
      return `${baseClasses} bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700`;
    case 'medium':
      return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700`;
    case 'low':
      return `${baseClasses} bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700`;
    default:
      return `${baseClasses} bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600`;
  }
};
```

### Role Badges

```javascript
export const getRoleBadgeClass = (role) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded text-xs font-medium border';
  switch (role?.toLowerCase()) {
    case 'admin':
      return `${baseClasses} bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700`;
    case 'approver':
      return `${baseClasses} bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700`;
    case 'implementor':
      return `${baseClasses} bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700`;
    default:
      return `${baseClasses} bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600`;
  }
};
```

### Pill Badge (Category)

```html
<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
  Category Name
</span>
```

### Compact Badge (Risk/Impact)

```html
<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
  Medium
</span>
```

---

## Form Inputs

### Text Input

```html
<div>
  <label for="field" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Field Label
  </label>
  <input
    type="text"
    id="field"
    name="field"
    class="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
    placeholder="Enter value..."
  />
  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
    Helper text explaining the field
  </p>
</div>
```

### Input with Error State

```html
<input
  class="w-full px-3 py-2 border rounded-lg text-sm border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>
<p class="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center">
  <svg class="w-4 h-4 mr-1">...</svg>
  Error message here
</p>
```

### Required Field Indicator

```html
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  Field Name
  <span class="text-red-500 dark:text-red-400 ml-1">*</span>
</label>
```

### Select Dropdown

```html
<select
  class="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-700"
>
  <option value="">Select option</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>
```

### Textarea

```html
<textarea
  rows="4"
  class="w-full px-3 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none text-gray-900 dark:text-gray-100 dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
  placeholder="Enter description..."
></textarea>
```

### Date Input

```html
<input
  type="date"
  class="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-700"
  min="2024-01-01"
/>
```

### Character Counter

```html
<div class="flex justify-between items-start mt-2">
  <p class="text-xs text-gray-500 dark:text-gray-400">
    150/5000 characters
  </p>
  <!-- Warning when near limit -->
  <p class="text-xs text-amber-600 dark:text-amber-400">
    Approaching character limit
  </p>
</div>
```

---

## Toggle Switch

```html
<button
  type="button"
  role="switch"
  aria-checked="false"
  class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-gray-200 dark:bg-gray-700"
>
  <span class="sr-only">Toggle setting</span>
  <span
    aria-hidden="true"
    class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 translate-x-0"
  ></span>
</button>

<!-- Active state: bg-blue-600, translate-x-5 -->
```

---

## Cards

### Standard Card

```html
<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
  <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Card Title</h3>
  </div>
  <div class="p-6">
    <!-- Card content -->
  </div>
</div>
```

### Compact Info Card

```html
<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
  <div class="flex items-center justify-between">
    <div class="flex items-center">
      <svg class="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2">...</svg>
      <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Card Label</span>
    </div>
    <!-- Action/content on right -->
  </div>
</div>
```

### Status Card (Info/Warning/Error)

```html
<!-- Info -->
<div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
  <div class="flex items-center">
    <svg class="w-4 h-4 text-blue-600 dark:text-blue-300 mr-2">...</svg>
    <span class="text-sm font-medium text-blue-900 dark:text-blue-100">Info message</span>
  </div>
</div>

<!-- Warning -->
<div class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
  ...
</div>

<!-- Error -->
<div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
  ...
</div>
```

### Feature Card with Icon

```html
<div class="flex items-start">
  <div class="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
    <svg class="w-4 h-4 text-green-600 dark:text-green-300">...</svg>
  </div>
  <div>
    <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">Feature Title</h4>
    <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Feature description</p>
  </div>
</div>
```

---

## List Items

### Clickable List Item

```html
<a href="/item/1" class="block p-4 hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors group">
  <div class="flex items-start">
    <div class="flex-1 min-w-0">
      <h4 class="text-base font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        Item Title
      </h4>
      <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mt-1">
        Item description preview...
      </p>
      <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
        <span class="flex items-center">
          <svg class="w-3 h-3 mr-1">...</svg>
          Metadata
        </span>
      </div>
    </div>
    <div class="flex items-center space-x-2 ml-4">
      <span class="badge">Status</span>
    </div>
  </div>
</a>
```

### List Container with Dividers

```html
<div class="divide-y divide-gray-100 dark:divide-gray-700">
  <!-- List items -->
</div>
```

---

## Status Indicators

### Online/Offline Dot

```html
<!-- Online -->
<div class="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>

<!-- Offline/Warning -->
<div class="w-2 h-2 bg-yellow-500 dark:bg-yellow-400 rounded-full"></div>

<!-- Checking (animated) -->
<div class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
```

### Status with Label

```html
<div class="flex items-center">
  <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
  <span class="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
</div>
```

---

## Icons

### Standard Icon Pattern

```html
<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
</svg>
```

### Common Icons (SVG paths)

```javascript
// Plus
d="M12 4v16m8-8H4"

// Back arrow
d="M10 19l-7-7m0 0l7-7m-7 7h18"

// Chevron right (expand)
d="M9 5l7 7-7 7"

// Check
d="M5 13l4 4L19 7"

// X (close)
d="M6 18L18 6M6 6l12 12"

// User
d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"

// Calendar
d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"

// Document
d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"

// Warning/Alert
d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"

// Info circle
d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"

// Upload cloud
d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
```

---

## File Upload

### Drag and Drop Zone

```html
<label
  class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
>
  <div class="flex flex-col items-center justify-center pt-5 pb-6">
    <svg class="w-8 h-8 mb-2 text-gray-400 dark:text-gray-500">...</svg>
    <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
      <span class="font-semibold">Click to upload</span> or drag and drop
    </p>
    <p class="text-xs text-gray-500">Maximum file size: 10MB</p>
  </div>
  <input type="file" class="hidden" />
</label>
```

### Active Drag State

```html
<label class="... border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 scale-[1.02]">
  <p class="text-blue-600 dark:text-blue-400 font-semibold">Drop file here</p>
</label>
```

### Selected File Display

```html
<div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
  <div class="flex items-center gap-3">
    <div class="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
      <svg class="w-5 h-5 text-blue-600 dark:text-blue-300">...</svg>
    </div>
    <div>
      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">filename.pdf</p>
      <p class="text-xs text-gray-500 dark:text-gray-400">2.5 MB</p>
    </div>
  </div>
  <button class="text-red-600 dark:text-red-400">Remove</button>
</div>
```

---

## Tables

### Standard Table Header

```html
<thead class="bg-gray-50 dark:bg-gray-700">
  <tr>
    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      Column
    </th>
  </tr>
</thead>
```

### Table Row

```html
<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
  <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
    Cell content
  </td>
</tr>
```

---

## Accessibility Patterns

### Screen Reader Only Text

```html
<span class="sr-only">Description for screen readers</span>
```

### Decorative Icons

```html
<svg aria-hidden="true" class="w-4 h-4">...</svg>
```

### Focus States

```html
<element class="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
```

### Label Association

```html
<label for="fieldId" class="...">Label</label>
<input id="fieldId" name="fieldName" />
```
