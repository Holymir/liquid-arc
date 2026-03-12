---
name: command-palette
description: Use when adding a full-screen command palette (Ctrl+K / ⌘K) with cache-driven data, role-gated navigation, dynamic fallback search, and discoverability UX (navbar pill + first-visit toast). Based on ReleaseFlow's production implementation.
---

# Command Palette

Full-screen modal command palette with keyboard navigation, React Query cache reading, role-based route filtering, dynamic search fallback, and two-layer discoverability (navbar search pill + one-time info toast).

## When to Use

- Adding a Ctrl+K / ⌘K command palette to a React app
- Need to surface cached React Query data as searchable commands
- Want role-gated navigation items (admin-only routes hidden from normal users)
- Need dynamic fallback search (e.g., typed pattern triggers a search action when no cache match)
- Adding discoverability for a hidden keyboard shortcut

## Architecture

```
App.tsx
  ├─ <CommandPalette />        — global, always mounted, renders null when closed
  ├─ <CommandPaletteTip />     — one-time info toast on first authenticated load
  └─ ...routes...

Navbar.tsx
  └─ Search pill button        — visible trigger, dispatches synthetic Ctrl+K event

CommandPalette.tsx (self-contained)
  ├─ Global keydown listener   — Ctrl+K / ⌘K toggle, Escape close
  ├─ items (useMemo)           — built from routes + React Query cache + static actions
  ├─ filtered (useMemo)        — query match + dynamic fallback entries
  ├─ grouped (useMemo)         — categorized for display
  └─ Keyboard nav              — ArrowUp/Down, Enter, scroll-into-view
```

## Key Patterns

### 1. Self-Contained Global Component

The palette owns its own open/close state. No prop drilling, no context. Mounted once at the app root level (inside providers, outside routes).

```tsx
// App.tsx — inside AuthProvider + ToastProvider, before <Routes>
<CommandPalette />
<CommandPaletteTip />
```

### 2. React Query Cache as Data Source

Read cached data using `getQueriesData` (prefix match) instead of fetching. Items appear instantly from whatever the user has already loaded.

```tsx
const queryClient = useQueryClient();

// Prefix match — gets all queries starting with ['tracked-repos']
const repoQueries = queryClient.getQueriesData<Array<{ id: number; owner: string; name: string }>>({
  queryKey: ['tracked-repos'],
});
const reposData = repoQueries.find(([, data]) => Array.isArray(data) && data.length > 0)?.[1];
```

**Key distinction**: `getQueriesData` for prefix match (multiple cache entries), `getQueryData` for exact key match (single entry).

### 3. Role-Gated Navigation

Admin-only routes are conditionally spread into the routes array. Never show routes the user can't access.

```tsx
const { user } = useAuth();
const isAdmin = user?.role === 'admin';

const routes = [
  { path: '/release-flow', label: 'Release Flow', icon: GitBranch },
  { path: '/jira-commits', label: 'Jira Commits', icon: Ticket },
  { path: '/profile', label: 'Profile', icon: Globe },
  ...(isAdmin ? [
    { path: '/admin', label: 'Admin', icon: Settings },
    { path: '/analytics', label: 'Analytics', icon: Globe },
  ] : []),
];
```

### 4. Dynamic Fallback Search

When a typed query matches a known pattern (e.g., Jira key `PROJ-123`) but has no cache hit, inject a "Search for X" action dynamically.

```tsx
const JIRA_KEY_PATTERN = /^[A-Z][A-Z0-9]+-\d+$/i;

const filtered = useMemo(() => {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  const matched = items.filter((item) => item.label.toLowerCase().includes(q));

  const trimmed = query.trim();
  const hasJiraMatch = matched.some((item) => item.category === 'Jira Keys');
  if (JIRA_KEY_PATTERN.test(trimmed) && !hasJiraMatch) {
    const upperKey = trimmed.toUpperCase();
    matched.push({
      id: `jira-search-${upperKey}`,
      label: `Search Jira for ${upperKey}`,
      category: 'Quick Search',
      icon: Search,
      action: () => { navigate(`/jira-commits?key=${upperKey}`); setIsOpen(false); },
    });
  }
  return matched;
}, [items, query, navigate]);
```

### 5. Navbar Search Pill (Discoverability Layer 1)

A small clickable pill in the navbar that opens the palette via synthetic keyboard event. No prop drilling needed — the CommandPalette already listens on `document`.

```tsx
// Platform-aware shortcut label
const shortcutLabel = useMemo(() => {
  return navigator.platform.toUpperCase().includes('MAC') ? '⌘K' : 'Ctrl+K';
}, []);

// Dispatch synthetic event — CommandPalette's listener handles it
const openCommandPalette = () => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
};

// JSX — placed between nav links and user menu
<button
  onClick={openCommandPalette}
  className="flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-full bg-white/30 hover:bg-white/50 transition-colors cursor-pointer"
>
  <Search size={14} className="text-gray-500" />
  <kbd className="text-[11px] font-mono text-gray-500 bg-white/60 px-1.5 py-0.5 rounded border border-gray-200/60">
    {shortcutLabel}
  </kbd>
</button>
```

### 6. First-Visit Tip Toast (Discoverability Layer 2)

A one-time info toast gated by `localStorage` + auth state. Placed in App.tsx so it fires regardless of landing page.

```tsx
const CMDK_TIP_KEY = 'rf-seen-cmdk-tip';

const CommandPaletteTip: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const shortcutLabel = useMemo(() => {
    return navigator.platform.toUpperCase().includes('MAC') ? '⌘K' : 'Ctrl+K';
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (localStorage.getItem(CMDK_TIP_KEY)) return;
    localStorage.setItem(CMDK_TIP_KEY, '1');
    addToast({
      type: 'info',
      title: 'Pro tip',
      message: `Press ${shortcutLabel} to search repos, Jira keys, and navigate anywhere`,
      duration: 6000,
    });
  }, [isAuthenticated, addToast, shortcutLabel]);

  return null;
};
```

### 7. Keyboard Navigation

Arrow keys move selection, Enter executes, scroll-into-view keeps selected item visible. Selection resets on query change.

```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
  } else if (e.key === 'Enter' && filtered[selectedIndex]) {
    e.preventDefault();
    filtered[selectedIndex].action();
  }
};

// Scroll selected into view
useEffect(() => {
  if (listRef.current) {
    const selected = listRef.current.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }
}, [selectedIndex]);
```

## Item Interface

```tsx
interface CommandItem {
  id: string;
  label: string;
  category: string;      // Groups items under headers: "Navigation", "Repositories", "Jira Keys", "Actions"
  icon: React.ElementType;
  action: () => void;    // Always call setIsOpen(false) inside action
}
```

## Gotchas

- **useMemo deps**: Include `isOpen` so items rebuild when palette opens (captures fresh cache). Include `user?.role` for role gating.
- **Synthetic KeyboardEvent**: Must set `bubbles: true` for the event to reach the `document` listener.
- **Don't list dead routes**: Only include routes that are actually used. Audit periodically.
- **Tip toast placement**: Must be inside both `<AuthProvider>` and `<ToastProvider>` — put in App.tsx, not Layout.tsx (Layout doesn't wrap all pages).
- **Platform detection**: Use `navigator.platform.toUpperCase().includes('MAC')` — works on all browsers. Show `⌘K` on Mac, `Ctrl+K` everywhere else.

## Files (ReleaseFlow)

| File | Role |
|------|------|
| `frontend/src/components/common/CommandPalette.tsx` | Full palette component |
| `frontend/src/components/layout/Navbar.tsx` | Search pill trigger |
| `frontend/src/App.tsx` | Mounts palette + tip toast |
| `frontend/src/contexts/ToastContext.tsx` | Toast provider (tip uses `addToast`) |
| `frontend/src/contexts/AuthContext.tsx` | Auth state (role gating + tip auth check) |
