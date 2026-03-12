---
name: ux-navigation-layout
description: Use when building page layouts and navigation - provides patterns for sidebars, navbars, page headers, filtering, pagination, responsive grids, and dark mode context.
---

# UX Navigation & Layout Patterns

Standard navigation and layout patterns for internal tools. These patterns ensure consistent information architecture across all applications.

---

## Page Layout

### Master Layout Structure

```javascript
const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content */}
      <div class="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main content area */}
        <main class="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

### Responsive Content Padding

```html
<main class="flex-1 overflow-y-auto p-4 md:p-6 lg:px-8">
  <!-- Page content -->
</main>
```

---

## Sidebar

### Sidebar Structure

```javascript
const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: '...' },
    { name: 'Items', path: '/items', icon: '...' },
    { name: 'Create New', path: '/items/new', icon: '...' },
    { name: 'Analytics', path: '/analytics', icon: '...' },
  ];

  // Add role-based items
  if (user?.role === 'admin') {
    navItems.push({ name: 'Users', path: '/users', icon: '...' });
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          class="fixed inset-0 z-40 bg-gray-900 dark:bg-black bg-opacity-90 dark:bg-opacity-70 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside class={`
        fixed inset-y-0 left-0 z-50 w-64
        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
        dark:from-slate-950 dark:via-slate-900 dark:to-slate-950
        shadow-xl transform transition-all duration-300 ease-in-out
        md:translate-x-0 md:static md:inset-auto md:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar header */}
        <div class="h-16 flex items-center justify-between px-6 border-b border-slate-700/40">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">AI</span>
            </div>
            <h2 class="text-xl font-bold text-slate-200">App Name</h2>
          </div>

          {/* Mobile close button */}
          <button
            onClick={toggleSidebar}
            class="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50"
          >
            <svg class="h-6 w-6"><!-- X icon --></svg>
          </button>
        </div>

        {/* Navigation */}
        <nav class="mt-6 px-4 space-y-1">
          {navItems.map(item => (
            <NavItem key={item.name} item={item} currentPath={location.pathname} />
          ))}
        </nav>

        {/* User info at bottom */}
        <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/40">
          <div class="flex items-center space-x-3 px-2 py-2 rounded-lg bg-slate-800/40">
            <div class="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
              <span class="text-white font-semibold text-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white truncate">{user?.name}</p>
              <p class="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
```

### Navigation Item with Active State

```javascript
const NavItem = ({ item, currentPath }) => {
  const isActive = currentPath === item.path ||
    (item.path !== '/' && currentPath.startsWith(item.path));

  return (
    <NavLink
      to={item.path}
      class={`
        group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-lg
        transition-all duration-300 ease-out transform
        ${isActive
          ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-md border-l-2 border-slate-400 translate-x-1'
          : 'text-slate-300 hover:text-white hover:bg-slate-800/60 hover:translate-x-1'
        }
      `}
    >
      {/* Icon */}
      <div class={`flex-shrink-0 mr-3 p-1.5 rounded-md transition-all ${
        isActive
          ? 'bg-slate-600/50 text-white'
          : 'text-slate-400 group-hover:text-slate-200'
      }`}>
        <svg class="h-4 w-4"><!-- icon --></svg>
      </div>

      {/* Text */}
      <span class="flex-1">{item.name}</span>

      {/* Active indicator */}
      {isActive && (
        <div class="w-1.5 h-1.5 bg-slate-300 rounded-full opacity-80" />
      )}
    </NavLink>
  );
};
```

---

## Navbar

### Navbar Structure

```javascript
const Navbar = ({ toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">

          {/* Left side */}
          <div class="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span class="sr-only">Open sidebar</span>
              <svg class="h-6 w-6"><!-- hamburger icon --></svg>
            </button>

            {/* Logo/Title */}
            <Link to="/" class="flex-shrink-0 flex items-center">
              <div class="flex flex-col">
                <span class="text-xl font-bold text-primary-600 dark:text-primary-400">
                  Application Name
                </span>
                {/* Status indicator */}
                <StatusIndicator />
              </div>
            </Link>
          </div>

          {/* Right side */}
          <div class="flex items-center">
            <span class="badge mr-3">{user?.role}</span>
            <ProfileMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
```

### Status Indicator

```html
<!-- Online -->
<div class="flex items-center mt-1">
  <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
  <span class="text-xs text-green-600 font-medium">System Online</span>
</div>

<!-- Checking -->
<div class="flex items-center mt-1">
  <div class="w-2 h-2 bg-gray-400 rounded-full mr-2 animate-pulse"></div>
  <span class="text-xs text-gray-600 font-medium">Checking status...</span>
</div>

<!-- Degraded -->
<div class="flex items-center mt-1">
  <div class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
  <span class="text-xs text-yellow-600 font-medium">Limited Mode</span>
</div>
```

---

## Profile Menu

### Dropdown Profile Menu

```javascript
const ProfileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const menuRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} class="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <div class="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
          <span class="text-primary-600 dark:text-primary-400 font-medium text-sm">
            {user?.name?.charAt(0)}
          </span>
        </div>
        <svg class={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <!-- chevron-down -->
        </svg>
      </button>

      {isOpen && (
        <div class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          {/* User info */}
          <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>

          {/* Menu items */}
          <div class="py-1">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
            >
              <span>Dark Mode</span>
              <span class="text-xs">{isDarkMode ? 'On' : 'Off'}</span>
            </button>

            {/* Change password */}
            <button class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              Change Password
            </button>
          </div>

          {/* Logout */}
          <div class="py-1 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={logout}
              class="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## Page Headers

### Standard Page Header

```html
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Page Title</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Page description or subtitle</p>
  </div>
  <a href="/new" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
    <svg class="w-4 h-4 mr-2"><!-- plus icon --></svg>
    New Item
  </a>
</div>
```

### Compact Header with Back Button

```html
<div class="flex items-center justify-between mb-4">
  <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Page Title</h1>
  <button onClick={() => navigate(-1)}
    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
  >
    <svg class="w-4 h-4 mr-1"><!-- arrow-left --></svg>
    Back
  </button>
</div>
```

---

## Data Lists with Filtering

### Filter Bar

```html
<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
  <div class="p-4 border-b border-gray-100 dark:border-gray-700">
    <div class="flex items-center gap-4">
      {/* Filter inputs */}
      <div class="flex-1 grid grid-cols-4 gap-2">
        <input
          type="text"
          name="search"
          class="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          placeholder="Search..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />

        <select class="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 bg-white dark:bg-gray-700">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select class="text-sm border ...">
          <option value="">All Categories</option>
          <!-- options -->
        </select>

        <select class="text-sm border ...">
          <option value="">All Dates</option>
          <option value="today">Today</option>
          <option value="last_7_days">Last 7 days</option>
          <option value="last_30_days">Last 30 days</option>
        </select>
      </div>

      {/* Action buttons */}
      <div class="flex items-center gap-2">
        <button onClick={handleSearch}
          class="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
          Search
        </button>
        <button onClick={clearFilters}
          class="px-2 py-2 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
          title="Reset filters">
          <svg class="w-4 h-4"><!-- refresh icon --></svg>
        </button>
      </div>
    </div>
  </div>
</div>
```

### Active Filters Count

```javascript
const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

// Show in UI
{activeFiltersCount > 0 && (
  <span class="text-xs text-gray-500">
    {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
  </span>
)}
```

---

## Pagination

### Smart Pagination Component

```javascript
const Pagination = ({ currentPage, totalPages, skip, limit, totalItems, onPageChange }) => {

  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      if (currentPage <= 4) {
        // Near beginning: 1 2 3 4 5 ... 100
        for (let i = 1; i <= 5; i++) items.push(i);
        items.push('...');
        items.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near end: 1 ... 96 97 98 99 100
        items.push(1);
        items.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) items.push(i);
      } else {
        // Middle: 1 ... 45 46 47 ... 100
        items.push(1);
        items.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) items.push(i);
        items.push('...');
        items.push(totalPages);
      }
    }
    return items;
  };

  return (
    <div class="px-4 py-3 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm">
      {/* Summary */}
      <div class="text-gray-700 dark:text-gray-300">
        Showing <span class="font-medium">{skip + 1}</span> to{' '}
        <span class="font-medium">{Math.min(skip + limit, totalItems)}</span>
        {totalItems > 0 && ` of ${totalItems}`}
      </div>

      {/* Controls */}
      <div class="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-4 h-4 mr-1"><!-- chevron-left --></svg>
          Previous
        </button>

        {/* Page numbers */}
        <div class="flex items-center space-x-1">
          {getPaginationItems().map((item, index) => (
            item === '...' ? (
              <span key={index} class="px-2 py-1 text-gray-500">...</span>
            ) : (
              <button
                key={item}
                onClick={() => onPageChange(item)}
                class={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors
                  ${currentPage === item
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
              >
                {item}
              </button>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          class="inline-flex items-center px-3 py-1.5 ..."
        >
          Next
          <svg class="w-4 h-4 ml-1"><!-- chevron-right --></svg>
        </button>
      </div>
    </div>
  );
};
```

---

## Responsive Grid Layouts

### Two-Column Form Layout

```html
<div class="grid grid-cols-1 2xl:grid-cols-3 gap-6">
  {/* Main content - spans 2 columns on wide screens */}
  <div class="2xl:col-span-2">
    <!-- Large textarea, main fields -->
  </div>

  {/* Sidebar - 1 column */}
  <div class="space-y-6">
    <!-- Secondary fields, help content -->
  </div>
</div>
```

### Card Grid

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} item={item} />
  ))}
</div>
```

### Feature Grid

```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  <FeatureCard icon="check" title="Be Specific" description="..." />
  <FeatureCard icon="info" title="Provide Context" description="..." />
  <FeatureCard icon="users" title="Mention Stakeholders" description="..." />
</div>
```

---

## Mobile Responsive Patterns

### Hide on Mobile

```html
<div class="hidden md:block">
  <!-- Desktop only content -->
</div>
```

### Show Only on Mobile

```html
<button class="md:hidden">
  <!-- Mobile menu button -->
</button>
```

### Mobile Sidebar Transform

```html
<aside class={`
  fixed inset-y-0 left-0 z-50 w-64
  transform transition-all duration-300 ease-in-out
  md:translate-x-0 md:static
  ${isOpen ? 'translate-x-0' : '-translate-x-full'}
`}>
```

### Mobile Backdrop

```html
{isOpen && (
  <div
    class="fixed inset-0 z-40 bg-gray-900 bg-opacity-90 md:hidden"
    onClick={closeSidebar}
  />
)}
```

---

## Accessibility

### Skip Link

```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white px-4 py-2 rounded shadow">
  Skip to main content
</a>

<main id="main-content">
  <!-- Page content -->
</main>
```

### ARIA Landmarks

```html
<header role="banner">...</header>
<nav role="navigation" aria-label="Main">...</nav>
<main role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>
```

### Focus Management

```javascript
// Focus first input when modal opens
useEffect(() => {
  if (isOpen) {
    inputRef.current?.focus();
  }
}, [isOpen]);
```

### Screen Reader Text

```html
<button>
  <svg aria-hidden="true">...</svg>
  <span class="sr-only">Close menu</span>
</button>
```

---

## Breadcrumbs (Optional Pattern)

```html
<nav class="flex mb-4" aria-label="Breadcrumb">
  <ol class="flex items-center space-x-2 text-sm">
    <li>
      <a href="/" class="text-gray-500 hover:text-gray-700">Home</a>
    </li>
    <li class="flex items-center">
      <svg class="w-4 h-4 text-gray-400 mx-1"><!-- chevron-right --></svg>
      <a href="/items" class="text-gray-500 hover:text-gray-700">Items</a>
    </li>
    <li class="flex items-center">
      <svg class="w-4 h-4 text-gray-400 mx-1"><!-- chevron-right --></svg>
      <span class="text-gray-900 font-medium">Current Page</span>
    </li>
  </ol>
</nav>
```

---

## Dark Mode Context

### Dark Mode Provider

```javascript
const DarkModeContext = createContext();

export const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = getCookie('darkMode');
    return saved === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setCookie('darkMode', isDarkMode.toString(), 365);
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => useContext(DarkModeContext);
```

---

## Route Protection

### Protected Route Component

```javascript
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Usage
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminPage />
    </ProtectedRoute>
  }
/>
```
