---
name: command-palette-search
description: Use when adding a search bar, command palette, or Ctrl+K search to a navbar or header. Provides a complete React search input with dropdown results, keyboard navigation, debounced filtering, and enterprise styling.
---

# Command Palette Search

A polished, enterprise-grade search bar with dropdown results panel — the kind you see on Stripe, Linear, or Notion. Ctrl+K to open, arrow keys to navigate, Enter to select, Esc to close.

## When to Use

- Adding search to a navbar or header
- Building a command palette / spotlight search
- User mentions "Ctrl+K search", "search bar", "command palette"
- Adding workflow/item search with keyboard navigation

## Features

- Ctrl+K keyboard shortcut to focus
- Debounced client-side filtering (150ms)
- Arrow key navigation with highlighted row
- Loading state with spinner
- Empty state with icon + message
- Clear button (X) when query is non-empty
- Keyboard hints footer (arrows, enter, esc)
- Click-outside to close
- Route-change auto-close
- Lazy data fetch on first focus
- Status dots + tags in result rows
- Relative time formatting

## Dependencies

- `react` (useState, useEffect, useRef, useCallback)
- `react-router-dom` (useNavigate, useLocation) — for navigation on select + route-change close
- `lucide-react` — icons: `Search`, `X`, `Loader2`, `FileText`, `Clock`

## Architecture

```
[Input Field]
  ├─ Left: Search icon (accent color when focused)
  ├─ Right: Clear (X) button + Ctrl+K badge
  └─ [Dropdown Panel] (absolute, below input)
       ├─ Header: result count or "Recent items"
       ├─ Scrollable result list (max 320px)
       │    └─ Each row: icon + name + status dot + metadata + version
       └─ Footer: keyboard hints (↑↓ navigate, ⏎ open, esc close)
```

## Design Tokens

The search bar uses these semantic colors. Map them to your project's token system:

| Token | Default Value | Usage |
|-------|--------------|-------|
| `accent` | `#7C5CFC` | Focus ring, icon highlight, tag pills |
| `text-primary` | `#1A1A2E` | Input text, result names |
| `text-muted` | `#9CA3AF` | Placeholder, metadata, hints |
| `surface-muted` | `#F8FAFC` | Input bg (unfocused), highlighted row |
| `border` | `#E2E8F0` | Input border, dropdown border, dividers |
| `border-light` | `#F1F5F9` | Inner dividers, section borders |

## Styling Spec

### Input Field
```
height: 36px
padding-left: 36px (icon space)
padding-right: 62px (clear + badge space)
border-radius: 10px
background: #F8FAFC (unfocused) → #fff (focused)
border: 1px solid #F1F5F9 (unfocused) → rgba(accent, 0.4) (focused)
box-shadow: none (unfocused) → 0 0 0 3px rgba(accent, 0.08) (focused)
font-size: 14px (text-sm)
transition: all 200ms
```

### Ctrl+K Badge (shown when unfocused)
```
font-size: 10px
font-family: monospace
padding: 2px 6px
border-radius: 5px
border: 1px solid #E2E8F0
background: #fff
color: text-muted
```

### Dropdown Panel
```
top: calc(100% + 6px)
border-radius: 12px
border: 1px solid #E2E8F0
box-shadow: 0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)
max-height (results area): 320px, overflow-y: auto
z-index: 100
```

### Result Row
```
padding: 10px 12px
icon container: 32px, rounded-lg, accent/8 bg
name: 13px font-medium
status: 1.5px dot + 10px capitalize label
metadata: 11px text-muted with Clock icon
highlight: background #F8FAFC on hover/arrow
```

### Footer
```
padding: 6px 12px
border-top: 1px solid #F1F5F9
background: #FAFBFC
font-size: 10px
kbd: 1px border, 3px radius, white bg, monospace 9px
```

## Complete Implementation

### Types

Define a generic item type that the search operates on. Adapt fields to your domain:

```typescript
interface SearchItem {
  id: number | string
  name: string
  description?: string
  status: string
  tags?: string[]
  version?: number
  updated_at: string
}
```

### State & Refs

```typescript
const [query, setQuery] = useState('')
const [results, setResults] = useState<SearchItem[]>([])
const [isOpen, setIsOpen] = useState(false)
const [isLoading, setIsLoading] = useState(false)
const [highlightIndex, setHighlightIndex] = useState(-1)
const [allItems, setAllItems] = useState<SearchItem[]>([])

const inputRef = useRef<HTMLInputElement>(null)
const dropdownRef = useRef<HTMLDivElement>(null)
const debounceRef = useRef<number | null>(null)
```

### Data Fetching (lazy, on first focus)

```typescript
const fetchItems = useCallback(async () => {
  if (allItems.length > 0) return // only fetch once
  try {
    const data = await yourApi.list()
    setAllItems(data)
  } catch {
    // silently fail — search degrades gracefully
  }
}, [allItems.length])
```

### Client-Side Filtering

```typescript
const filterItems = useCallback((q: string) => {
  if (!q.trim()) {
    setResults(allItems.slice(0, 5)) // show recent when empty
    return
  }
  const lower = q.toLowerCase()
  const filtered = allItems.filter((item) =>
    item.name.toLowerCase().includes(lower) ||
    item.description?.toLowerCase().includes(lower) ||
    item.tags?.some((t) => t.toLowerCase().includes(lower))
  )
  setResults(filtered.slice(0, 8)) // cap at 8 results
}, [allItems])
```

### Effects

```typescript
// Debounced search (150ms)
useEffect(() => {
  if (!isOpen) return
  if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
  debounceRef.current = window.setTimeout(() => {
    filterItems(query)
    setHighlightIndex(-1)
  }, 150)
  return () => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
  }
}, [query, isOpen, filterItems])

// Re-filter when items load
useEffect(() => {
  if (isOpen && allItems.length > 0) filterItems(query)
}, [allItems, isOpen, query, filterItems])

// Close on click outside
useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }
  document.addEventListener('mousedown', handler)
  return () => document.removeEventListener('mousedown', handler)
}, [])

// Close on route change (if using react-router)
useEffect(() => {
  setIsOpen(false)
  setQuery('')
}, [location.pathname])

// Ctrl+K shortcut
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      inputRef.current?.focus()
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [])
```

### Event Handlers

```typescript
const handleFocus = async () => {
  setIsOpen(true)
  setIsLoading(true)
  await fetchItems()
  setIsLoading(false)
}

const handleSelect = (item: SearchItem) => {
  setIsOpen(false)
  setQuery('')
  navigate(`/your-route/${item.id}`) // adapt to your routing
}

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (!isOpen) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    setHighlightIndex((i) => (i < results.length - 1 ? i + 1 : 0))
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    setHighlightIndex((i) => (i > 0 ? i - 1 : results.length - 1))
  } else if (e.key === 'Enter' && highlightIndex >= 0 && results[highlightIndex]) {
    e.preventDefault()
    handleSelect(results[highlightIndex])
  } else if (e.key === 'Escape') {
    setIsOpen(false)
    inputRef.current?.blur()
  }
}
```

### Relative Time Helper

```typescript
function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}
```

### Status Color Helper

```typescript
function statusColor(status: string): string {
  if (status === 'active') return '#22c55e'
  if (status === 'archived') return '#94a3b8'
  return '#f59e0b' // draft/default
}
```

### JSX — Input Field

```tsx
<div
  ref={dropdownRef}
  className="hidden lg:flex items-center flex-1 justify-center relative"
  style={{ maxWidth: '360px', margin: '0 32px' }}
>
  <div className="relative w-full">
    <Search
      className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors"
      style={{ color: isOpen ? '#7C5CFC' : undefined }}
    />
    <input
      ref={inputRef}
      type="text"
      placeholder="Search workflows..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      className="w-full text-sm text-text-primary border transition-all duration-200"
      style={{
        height: '36px',
        paddingLeft: '36px',
        paddingRight: '62px',
        borderRadius: '10px',
        backgroundColor: isOpen ? '#fff' : '#F8FAFC',
        borderColor: isOpen ? 'rgba(124, 92, 252, 0.4)' : '#F1F5F9',
        boxShadow: isOpen ? '0 0 0 3px rgba(124, 92, 252, 0.08)' : 'none',
        outline: 'none',
      }}
    />
    {/* Right side: clear button + Ctrl+K badge */}
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
      {query && (
        <button
          onClick={() => { setQuery(''); inputRef.current?.focus() }}
          className="flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          style={{ width: 20, height: 20, borderRadius: 6 }}
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
      {!isOpen && (
        <span
          className="text-[10px] font-medium text-text-muted select-none"
          style={{
            padding: '2px 6px',
            borderRadius: 5,
            border: '1px solid #E2E8F0',
            backgroundColor: '#fff',
            fontFamily: 'monospace',
          }}
        >
          Ctrl+K
        </span>
      )}
    </div>
  </div>
```

### JSX — Dropdown Panel

```tsx
  {/* Dropdown results */}
  {isOpen && (
    <div
      className="absolute left-0 right-0"
      style={{
        top: 'calc(100% + 6px)',
        backgroundColor: '#fff',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 text-text-muted" style={{ padding: '24px 16px' }}>
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center" style={{ padding: '24px 16px' }}>
          <FileText size={24} className="mx-auto text-text-muted" style={{ opacity: 0.4, marginBottom: 8 }} />
          <p className="text-sm text-text-muted font-medium">
            {query ? 'No results found' : 'No items yet'}
          </p>
          {query && (
            <p className="text-xs text-text-muted" style={{ marginTop: 4 }}>
              Try a different search term
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between" style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9' }}>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              {query ? `${results.length} result${results.length !== 1 ? 's' : ''}` : 'Recent'}
            </span>
          </div>

          {/* Result rows */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {results.map((item, i) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightIndex(i)}
                className="w-full text-left flex items-center gap-3 transition-colors"
                style={{
                  padding: '10px 12px',
                  backgroundColor: highlightIndex === i ? '#F8FAFC' : 'transparent',
                  borderBottom: i < results.length - 1 ? '1px solid #F8FAFC' : 'none',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(124, 92, 252, 0.08)' }}
                >
                  <FileText size={14} style={{ color: '#7C5CFC' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-text-primary truncate">
                      {item.name}
                    </span>
                    <span
                      className="shrink-0 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: statusColor(item.status) }}
                    />
                    <span className="text-[10px] font-medium capitalize shrink-0" style={{ color: statusColor(item.status) }}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                    <span className="flex items-center gap-1 text-[11px] text-text-muted">
                      <Clock size={10} />
                      {formatRelativeTime(item.updated_at)}
                    </span>
                    {item.tags && item.tags.length > 0 && (
                      <>
                        <span className="text-text-muted" style={{ fontSize: 8 }}>&#x2022;</span>
                        {item.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium"
                            style={{
                              color: '#7C5CFC',
                              backgroundColor: 'rgba(124, 92, 252, 0.08)',
                              padding: '1px 6px',
                              borderRadius: 8,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
                {item.version != null && (
                  <span className="text-[10px] text-text-muted shrink-0" style={{ fontFamily: 'monospace' }}>
                    v{item.version}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Keyboard hints footer */}
          <div
            className="flex items-center justify-between text-[10px] text-text-muted"
            style={{ padding: '6px 12px', borderTop: '1px solid #F1F5F9', backgroundColor: '#FAFBFC' }}
          >
            <span>
              <kbd style={{ padding: '1px 4px', borderRadius: 3, border: '1px solid #E2E8F0', backgroundColor: '#fff', fontFamily: 'monospace', fontSize: 9 }}>&#x2191;&#x2193;</kbd>
              {' '}navigate
              {' '}<kbd style={{ padding: '1px 4px', borderRadius: 3, border: '1px solid #E2E8F0', backgroundColor: '#fff', fontFamily: 'monospace', fontSize: 9 }}>&#x23CE;</kbd>
              {' '}open
            </span>
            <span>
              <kbd style={{ padding: '1px 4px', borderRadius: 3, border: '1px solid #E2E8F0', backgroundColor: '#fff', fontFamily: 'monospace', fontSize: 9 }}>esc</kbd>
              {' '}close
            </span>
          </div>
        </>
      )}
    </div>
  )}
</div>
```

## Customization Checklist

When adapting to a new project:

- [ ] Replace `SearchItem` interface fields with your domain model
- [ ] Replace `yourApi.list()` with your data source
- [ ] Replace `navigate('/your-route/${item.id}')` with your navigation target
- [ ] Update placeholder text ("Search workflows..." → your domain)
- [ ] Swap `FileText` icon in results with your domain icon
- [ ] Map `statusColor()` to your status values
- [ ] Adjust accent color (`#7C5CFC`) to match your design system
- [ ] Adjust `maxWidth: '360px'` for your layout
- [ ] Add/remove metadata fields in result rows (tags, version, date)
- [ ] Adjust `hidden lg:flex` responsive breakpoint if needed

## Behavior Summary

| Interaction | Result |
|-------------|--------|
| Focus input | Opens dropdown, lazy-fetches data, shows recent items |
| Type query | 150ms debounce, filters by name/description/tags |
| Arrow Down/Up | Cycles through results with highlight |
| Enter | Navigates to highlighted result |
| Escape | Closes dropdown, blurs input |
| Click outside | Closes dropdown |
| Route change | Closes dropdown, clears query |
| Ctrl+K / Cmd+K | Focuses input from anywhere on page |
| Click X button | Clears query, keeps focus |
