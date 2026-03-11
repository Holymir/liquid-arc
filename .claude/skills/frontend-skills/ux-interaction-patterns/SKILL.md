---
name: ux-interaction-patterns
description: Use when implementing user interactions - provides patterns for form handling, validation, modals, dropdowns, loading states, notifications, confirmations, and drag-and-drop.
---

# UX Interaction Patterns

Standard interaction patterns for internal tools. These patterns ensure consistent user experience across all applications.

---

## Form Patterns

### Form State Management

Standard pattern for managing form state:

```javascript
const [formData, setFormData] = useState({
  title: '',
  description: '',
  category: '',
  priority: ''
});
const [errors, setErrors] = useState({});
const [isSubmitting, setIsSubmitting] = useState(false);

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));

  // Clear error when user starts typing
  if (errors[name]) {
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  }
};
```

### Validation Pattern

```javascript
const validateForm = () => {
  const newErrors = {};

  // Required field
  if (!formData.description?.trim()) {
    newErrors.description = 'Description is required';
  }

  // Length validation
  if (formData.description.trim().length < 10) {
    newErrors.description = 'Description must be at least 10 characters';
  }

  if (formData.description.trim().length > 5000) {
    newErrors.description = 'Description must be at most 5000 characters';
  }

  // Conditional required (based on system state)
  if (someCondition && !formData.title?.trim()) {
    newErrors.title = 'Title is required in this mode';
  }

  // Date validation
  if (formData.targetDate) {
    const selectedDate = new Date(formData.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      newErrors.targetDate = 'Date cannot be in the past';
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### Submit Handler Pattern

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setIsSubmitting(true);

  try {
    const response = await apiCall(formData);
    notification.success('Created successfully!');

    // Delay navigation to show success message
    setTimeout(() => {
      navigate(`/items/${response.id}`);
    }, 1000);

  } catch (error) {
    console.error('Error:', error);

    if (error.response?.data?.detail) {
      notification.error(`Failed: ${error.response.data.detail}`);
    } else {
      notification.error('Operation failed. Please try again.');
    }
  } finally {
    setIsSubmitting(false);
  }
};
```

### Error Display Pattern

```html
<!-- Inline field error -->
<div>
  <input class="... border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20" />
  <p class="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center">
    <svg class="w-4 h-4 mr-1"><!-- warning icon --></svg>
    {errors.fieldName}
  </p>
</div>

<!-- Form-level error banner -->
<div class="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
  {error}
</div>
```

### Conditional Required Fields

When system state affects validation:

```javascript
// In validation
if (systemStatus === 'degraded' && !formData.priority) {
  newErrors.priority = 'Priority is required when system is degraded';
}

// In UI
<label>
  Priority Level
  {systemStatus === 'degraded' && (
    <span class="text-red-500 dark:text-red-400 ml-1">*</span>
  )}
</label>

<p class="text-xs text-gray-500">
  {systemStatus === 'degraded'
    ? 'Priority must be specified in this mode'
    : 'Optional - will be determined automatically'
  }
</p>
```

---

## Modal Patterns

### Modal Structure

```javascript
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div class="fixed inset-0 bg-black dark:bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Modal Title
          </h2>
          <button
            onClick={onClose}
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg class="w-6 h-6"><!-- X icon --></svg>
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
};
```

### Form Modal with Success State

```javascript
const FormModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiCall(formData);
      setSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({});
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div class="modal-backdrop">
      <div class="modal-content">
        {success ? (
          <div class="text-center py-4">
            <div class="text-green-600 mb-2">
              <svg class="w-8 h-8 mx-auto"><!-- check icon --></svg>
            </div>
            <p class="text-green-600 font-medium">Success!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Form fields */}
            {error && <div class="error-banner">{error}</div>}
            {/* Buttons */}
          </form>
        )}
      </div>
    </div>
  );
};
```

### Modal Button Layout

```html
<div class="flex space-x-3 pt-4">
  <button type="button" onClick={handleClose}
    class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600">
    Cancel
  </button>
  <button type="submit" disabled={loading}
    class="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
    {loading ? 'Processing...' : 'Confirm'}
  </button>
</div>
```

---

## Dropdown Patterns

### Click-Outside Detection

```javascript
import { useState, useRef, useEffect } from 'react';

const Dropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} class="relative">
      <button onClick={() => setIsOpen(!isOpen)}>
        Toggle
        <svg class={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <!-- chevron icon -->
        </svg>
      </button>

      {isOpen && (
        <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          {/* Dropdown content */}
        </div>
      )}
    </div>
  );
};
```

### Dropdown Item

```html
<button class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
  Option
</button>
```

---

## Loading States

### Full-Page Loading

```html
<div class="p-12 text-center">
  <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
    <div class="animate-spin w-6 h-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
  </div>
  <p class="text-gray-500 dark:text-gray-400">Loading data...</p>
</div>
```

### Button Loading State

```html
<button disabled class="... disabled:opacity-50 disabled:cursor-not-allowed">
  <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
  Processing...
</button>
```

### Inline Loading Indicator

```html
<div class="flex items-center">
  <div class="w-2 h-2 bg-gray-400 rounded-full mr-2 animate-pulse"></div>
  <span class="text-xs text-gray-600">Checking status...</span>
</div>
```

---

## Empty States

### No Data Found

```html
<div class="p-12 text-center">
  <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
    <svg class="w-8 h-8 text-gray-400 dark:text-gray-500"><!-- document icon --></svg>
  </div>
  <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
    No items found
  </h3>
  <p class="text-gray-500 dark:text-gray-400 mb-6">
    Try adjusting your filters or create a new item.
  </p>
  <a href="/new" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
    Create New Item
  </a>
</div>
```

---

## Notification/Toast System

### Notification Context

```javascript
const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Convenience methods
  const success = (message, duration) => addNotification(message, 'success', duration);
  const error = (message, duration) => addNotification(message, 'error', duration);
  const warning = (message, duration) => addNotification(message, 'warning', duration);
  const info = (message, duration) => addNotification(message, 'info', duration);

  return (
    <NotificationContext.Provider value={{ success, error, warning, info, removeNotification }}>
      {children}
      <NotificationDisplay notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};
```

### Notification Display

```html
<div class="fixed top-4 right-4 z-50 space-y-2">
  {notifications.map(notification => (
    <div
      key={notification.id}
      class={`px-4 py-3 rounded-md shadow-md flex justify-between items-center ${
        notification.type === 'success' ? 'bg-green-100 text-green-800' :
        notification.type === 'error' ? 'bg-red-100 text-red-800' :
        notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
        'bg-blue-100 text-blue-800'
      }`}
    >
      <span>{notification.message}</span>
      <button onClick={() => onRemove(notification.id)} class="ml-4 text-gray-500 hover:text-gray-700">
        &times;
      </button>
    </div>
  ))}
</div>
```

### Usage

```javascript
const notification = useNotification();

// In handlers
notification.success('Item created successfully!');
notification.error('Failed to save changes');
notification.warning('Connection unstable');
notification.info('Processing your request...');
```

---

## Confirmation Dialogs

### Delete Confirmation Pattern

```javascript
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [itemToDelete, setItemToDelete] = useState(null);

const handleDeleteClick = (item) => {
  setItemToDelete(item);
  setShowDeleteConfirm(true);
};

const handleConfirmDelete = async () => {
  try {
    await deleteItem(itemToDelete.id);
    notification.success('Item deleted');
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    refreshData();
  } catch (error) {
    notification.error('Failed to delete item');
  }
};

// Render confirmation modal
{showDeleteConfirm && (
  <ConfirmModal
    title="Delete Item"
    message={`Are you sure you want to delete "${itemToDelete.name}"? This action cannot be undone.`}
    confirmText="Delete"
    confirmStyle="danger"
    onConfirm={handleConfirmDelete}
    onCancel={() => setShowDeleteConfirm(false)}
  />
)}
```

---

## Collapsible Sections

### Expandable Advanced Section

```javascript
const [showAdvanced, setShowAdvanced] = useState(false);

return (
  <div class="border-t border-gray-100 dark:border-gray-700 pt-6">
    <button
      type="button"
      onClick={() => setShowAdvanced(!showAdvanced)}
      class="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700"
    >
      <svg class={`w-4 h-4 mr-2 transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>
        <!-- chevron-right icon -->
      </svg>
      Advanced Options {showAdvanced ? '(Hide)' : '(Show)'}
    </button>

    {showAdvanced && (
      <div class="mt-4 space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        {/* Advanced fields */}
      </div>
    )}
  </div>
);
```

---

## Drag and Drop

### Drag State Management

```javascript
const [isDragging, setIsDragging] = useState(false);

const handleDragEnter = (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!isDisabled) {
    setIsDragging(true);
  }
};

const handleDragLeave = (e) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

const handleDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);

  if (isDisabled) return;

  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    handleFiles(files);
  }
};
```

### Visual Drag Feedback

```html
<div
  onDragEnter={handleDragEnter}
  onDragLeave={handleDragLeave}
  onDragOver={handleDragOver}
  onDrop={handleDrop}
  class={`border-2 border-dashed rounded-lg transition-all ${
    isDisabled
      ? 'opacity-50 cursor-not-allowed border-gray-300'
      : isDragging
        ? 'border-blue-500 bg-blue-50 scale-[1.02]'
        : 'border-gray-300 hover:bg-gray-100'
  }`}
>
  {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
</div>
```

---

## Keyboard Interactions

### Enter to Submit Search

```html
<input
  type="text"
  onKeyPress={(e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }}
  placeholder="Search..."
/>
```

### Escape to Close

```javascript
useEffect(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [onClose]);
```

---

## File Validation

### Size Validation

```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const handleFileSelect = (file) => {
  if (file.size > MAX_FILE_SIZE) {
    notification.error('File size exceeds 10MB limit');
    return;
  }

  setSelectedFile(file);
};
```

### Display File Info

```javascript
<p class="text-sm font-medium">{file.name}</p>
<p class="text-xs text-gray-500">
  {(file.size / 1024 / 1024).toFixed(2)} MB
</p>
```

---

## State Persistence

### Cookie-Based Filter Persistence

```javascript
import { setCookie, getCookie, deleteCookie } from '../utils/cookies';

// Load on mount
const [filters, setFilters] = useState(() => {
  const saved = getCookie('pageFilters');
  return saved || defaultFilters;
});

// Save on change
useEffect(() => {
  setCookie('pageFilters', filters, 30); // 30 days
}, [filters]);

// Clear
const clearFilters = () => {
  setFilters(defaultFilters);
  deleteCookie('pageFilters');
};
```

### Session-Based Pagination

```javascript
// Load
const [pagination, setPagination] = useState(() => {
  const saved = sessionStorage.getItem('pagePagination');
  return saved ? JSON.parse(saved) : { skip: 0, limit: 10 };
});

// Save
useEffect(() => {
  sessionStorage.setItem('pagePagination', JSON.stringify(pagination));
}, [pagination]);
```

---

## URL State Sync

### Read from URL on Mount

```javascript
const location = useLocation();

useEffect(() => {
  const params = new URLSearchParams(location.search);
  const statusFromUrl = params.get('status');

  if (statusFromUrl) {
    setFilters(prev => ({ ...prev, status: statusFromUrl }));
  }
}, [location.search]);
```

---

## Auto-Expand Based on System State

```javascript
// Auto-expand advanced fields when system is in degraded mode
useEffect(() => {
  if (systemStatus === 'degraded') {
    setShowAdvancedFields(true);
  }
}, [systemStatus]);
```
