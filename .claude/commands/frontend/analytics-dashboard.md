---
name: analytics-dashboard
description: Use when adding a full-stack analytics/usage-tracking feature to a FastAPI + React project. Provides backend models, middleware, aggregation service, API routes, and a polished enterprise-grade React dashboard with charts, KPI cards, and user activity tables.
---

# Analytics Dashboard

Add a complete full-stack analytics feature that tracks API usage, page views, and user sessions, then presents enterprise-grade insights via KPI cards, trend charts, user activity tables, and feature usage breakdowns.

**IMPORTANT**: When implementing the frontend components, you MUST also use the `enterprise-ui` skill for polished, institutional-grade styling. Apply its color systems, typography hierarchy, card patterns, and spacing tokens to all analytics UI components.

## When to Use This Skill

- Adding usage analytics or telemetry to a FastAPI + React project
- Building an admin dashboard to see who uses the app and which features
- Implementing request tracking middleware
- Creating KPI/metrics pages with charts

## Prerequisites

- **Backend**: Python FastAPI + SQLAlchemy + SQLite (or PostgreSQL with query adaptations)
- **Frontend**: React + TypeScript + Tailwind CSS + @tanstack/react-query
- **Auth**: JWT-based authentication with `get_current_user` and `get_admin_user` dependencies
- **Charts**: `recharts` library (installed as part of this skill)

## Architecture Overview

```
Backend:
  models/analytics.py     -> 3 tables (usage_events, page_views, user_sessions)
  middleware/analytics.py  -> Auto-records every API request
  services/analytics_service.py -> Aggregation queries
  schemas/analytics.py    -> Pydantic response/request models
  routes/analytics.py     -> Admin + tracking endpoints

Frontend:
  types/                  -> TypeScript interfaces
  services/api.ts         -> API client methods
  hooks/useAnalytics.ts   -> React Query hooks
  contexts/AnalyticsContext.tsx -> Auto page view + heartbeat tracking
  components/analytics/   -> Dashboard UI components
  pages/AnalyticsPage.tsx -> Page wrapper
```

---

## Step 1: Backend Models

Create `api/models/analytics.py` with three tables:

```python
"""Analytics models for tracking usage, page views, and sessions."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Index
from api.database import Base


class UsageEvent(Base):
    """Tracks API endpoint usage - auto-populated by middleware."""
    __tablename__ = "usage_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    endpoint = Column(String(500), nullable=False)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time_ms = Column(Float, nullable=False)
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_usage_events_user_created", "user_id", "created_at"),
        Index("ix_usage_events_endpoint_created", "endpoint", "created_at"),
    )


class PageView(Base):
    """Tracks frontend page views - populated by frontend beacon."""
    __tablename__ = "page_views"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    path = Column(String(500), nullable=False)
    referrer = Column(Text, nullable=True)
    session_id = Column(String(100), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_page_views_user_created", "user_id", "created_at"),
    )


class UserSession(Base):
    """Tracks user sessions - created/updated alongside page views + heartbeats."""
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_activity_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    page_count = Column(Integer, default=0, nullable=False)

    __table_args__ = (
        Index("ix_user_sessions_user_started", "user_id", "started_at"),
    )
```

**IMPORTANT FK rules**:
- `UsageEvent.user_id`: `nullable=True` + `ondelete="SET NULL"` (log entries survive user deletion)
- `PageView.user_id` and `UserSession.user_id`: `nullable=False` + `ondelete="CASCADE"` (never use SET NULL with nullable=False)

**Registration**: Add imports to `models/__init__.py` and `database.py` `init_db()`.

---

## Step 2: Request Tracking Middleware

Create `api/middleware/analytics.py`:

```python
"""Middleware to track API usage for analytics."""
import time
import logging
from datetime import datetime
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from api.database import SessionLocal
from api.auth.jwt_handler import decode_access_token
from api.models.analytics import UsageEvent

logger = logging.getLogger(__name__)

SKIP_PATHS = {"/api/healthcheck", "/api/docs", "/api/redoc", "/api/openapi.json"}
SKIP_PREFIXES = ("/api/admin/analytics", "/static", "/assets")


class AnalyticsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        if not path.startswith("/api/"):
            return await call_next(request)
        if path in SKIP_PATHS or path.startswith(SKIP_PREFIXES):
            return await call_next(request)

        # Extract user_id from JWT
        user_id = None
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token_data = decode_access_token(auth_header[7:])
            if token_data:
                user_id = token_data.user_id

        # Time the request
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000

        # Fire-and-forget DB insert (silent fail)
        try:
            db = SessionLocal()
            try:
                db.add(UsageEvent(
                    user_id=user_id, endpoint=path, method=request.method,
                    status_code=response.status_code, response_time_ms=round(elapsed_ms, 2),
                    user_agent=request.headers.get("user-agent"),
                    ip_address=request.client.host if request.client else None,
                    created_at=datetime.utcnow(),
                ))
                db.commit()
            finally:
                db.close()
        except Exception:
            logger.debug("Failed to record analytics event", exc_info=True)

        return response
```

**Register** in `main.py` AFTER CORS middleware:
```python
from api.middleware.analytics import AnalyticsMiddleware
app.add_middleware(AnalyticsMiddleware)
```

**Key decisions**:
- Skip analytics endpoints to avoid recursive tracking
- New `SessionLocal()` per insert (not the request's session)
- Silent fail - analytics must never break the app

---

## Step 3: Analytics Service

Create `api/services/analytics_service.py` with these functions:

| Function | Purpose |
|----------|---------|
| `get_overview(db, start, end)` | KPI summary: active users today/week/month, total requests, sessions, avg duration, page views, unique users |
| `get_user_activity(db, start, end, sort_by, limit, offset)` | Per-user breakdown joining User table with pagination |
| `get_trends(db, start, end, granularity)` | Time-series grouped by day/week/month |
| `get_endpoint_usage(db, start, end, limit)` | Top endpoints mapped to feature names |
| `cleanup_old_data(db, days=90)` | Delete data older than N days |

**Endpoint-to-Feature Mapping** - Customize this for each project:
```python
ENDPOINT_FEATURE_MAP = [
    ("/api/stories", "Stories"),
    ("/api/sprints", "Sprints"),
    ("/api/releases", "Releases"),
    ("/api/auth", "Authentication"),
    ("/api/admin", "Admin"),
    # Add your project's endpoints here
]
```

**SQLite-specific functions used**: `func.strftime()` for date grouping, `func.julianday()` for duration calculation. Adapt if using PostgreSQL (`DATE_TRUNC`, `EXTRACT(EPOCH FROM ...)`).

---

## Step 4: Schemas

Create `api/schemas/analytics.py` using project's base schema (e.g., `APIModel` with camelCase alias generation):

**Response models**: `AnalyticsOverview`, `UserActivityItem` (user_id as `int`), `UserActivityResponse`, `TrendPoint`, `TrendsResponse`, `EndpointUsageItem`, `EndpointUsageResponse`

**Request models**: `PageViewCreate` (path, referrer?, session_id, duration_ms?), `SessionHeartbeat` (session_id)

**CRITICAL**: If using camelCase alias generation in schemas, backend query params are still snake_case. Frontend must send snake_case query params.

---

## Step 5: Routes

Create `api/routes/analytics.py`:

**Admin-only endpoints** (require admin role):
- `GET /overview` - Summary KPIs
- `GET /users` - Per-user breakdown (paginated, sortable)
- `GET /trends` - Time-series (day/week/month granularity)
- `GET /endpoints` - Feature usage ranking
- `DELETE /cleanup` - Data retention cleanup

**Tracking endpoints** (all authenticated users):
- `POST /track/pageview` - Record page view + create/update session
- `POST /track/heartbeat` - Update session last_activity_at

**All admin endpoints** accept `start_date` / `end_date` query params (YYYY-MM-DD, default last 30 days).

**IMPORTANT - Date validation**: Always wrap `datetime.strptime` in try/except ValueError, returning HTTP 400:
```python
def _parse_date_range(start_date, end_date):
    try:
        # ... strptime parsing ...
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
```

**Register** in `main.py`:
```python
app.include_router(analytics.router, prefix="/api/admin/analytics", tags=["Analytics"])
```

---

## Step 6: Frontend - Types, API Client, Hooks

### Install recharts
```bash
cd frontend && npm install recharts
```

### TypeScript types (add to `types/index.ts`)
```typescript
export interface AnalyticsOverview {
  activeUsersToday: number;
  activeUsersWeek: number;
  activeUsersMonth: number;
  totalRequests: number;
  totalSessions: number;
  avgSessionDurationMinutes: number;
  totalPageViews: number;
  uniqueUsers: number;
}

export interface UserActivityItem {
  userId: number;          // MUST be number, not string
  name: string;
  email: string;
  requestCount: number;
  sessionCount: number;
  totalTimeMinutes: number;
  lastActive?: string;     // MUST be optional (backend can return null)
}

export interface UserActivityResponse {
  items: UserActivityItem[];
  total: number;
}

export interface TrendPoint {
  date: string;
  activeUsers: number;
  requests: number;
  avgResponseTime: number;
}

export interface TrendsResponse {
  data: TrendPoint[];
  granularity: string;
}

export interface EndpointUsageItem {
  endpoint: string;
  featureName: string;
  method: string;
  count: number;
  avgResponseTime: number;
}

export interface EndpointUsageResponse {
  items: EndpointUsageItem[];
}
```

### API Client
**CRITICAL**: Send snake_case query param keys to match backend, even if internal TypeScript uses camelCase:
```typescript
export const analyticsApi = {
  getOverview: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/admin/analytics/overview', {
      params: params ? { start_date: params.startDate, end_date: params.endDate } : undefined
    }),
  // Same pattern for getUsers, getTrends, getEndpoints...
  trackPageView: (data: { path: string; referrer?: string; sessionId: string }) =>
    api.post('/admin/analytics/track/pageview', data),  // POST body uses camelCase (Pydantic handles it)
  trackHeartbeat: (data: { sessionId: string }) =>
    api.post('/admin/analytics/track/heartbeat', data),
};
```

### React Query Hooks (`hooks/useAnalytics.ts`)
Create hooks with 60s staleTime: `useAnalyticsOverview`, `useAnalyticsUsers`, `useAnalyticsTrends`, `useAnalyticsEndpoints`.

---

## Step 7: Frontend - Analytics Tracking Context

Create `contexts/AnalyticsContext.tsx`:

```typescript
export const AnalyticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const sessionIdRef = useRef(crypto.randomUUID());

  // Track page views on route change
  useEffect(() => {
    if (!user) return;
    analyticsApi.trackPageView({
      path: location.pathname,
      sessionId: sessionIdRef.current,
    }).catch(() => {});  // MUST use .catch(), NOT try/catch (async promise)
  }, [location.pathname, user]);

  // Heartbeat every 60s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      analyticsApi.trackHeartbeat({ sessionId: sessionIdRef.current }).catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  return <AnalyticsContext.Provider value={null}>{children}</AnalyticsContext.Provider>;
};
```

**CRITICAL**: Use `.catch(() => {})` for fire-and-forget tracking. Synchronous `try/catch` does NOT catch Promise rejections.

Wire into `App.tsx` inside `AuthProvider`, wrapping `Routes`.

---

## Step 8: Frontend - Dashboard Components

**IMPORTANT**: Apply the `enterprise-ui` skill patterns when building these components. Use its color systems, card patterns, typography scale, and status colors for a polished, institutional-grade appearance.

### Component Architecture

| Component | Purpose |
|-----------|---------|
| `DateRangePicker` | Preset buttons (Today, 7d, 30d, 90d) + custom date inputs |
| `OverviewCards` | 4 KPI cards with icons, values, subtitles, loading skeletons |
| `TrendsChart` | AreaChart (active users) + dual-axis LineChart (requests + response time) |
| `FeatureUsageChart` | Horizontal BarChart grouping endpoints by feature name |
| `UserActivityTable` | Full-width sortable table with null-safe rendering |
| `AnalyticsDashboard` | Main container composing all above with date range state |

### Enterprise UI Patterns to Apply

**KPI Cards** (from enterprise-ui stat patterns):
- White card with subtle border and shadow
- Icon in colored badge (top-right)
- Large bold value, muted subtitle
- Loading skeleton with `animate-pulse`

**Charts** (recharts + enterprise-ui colors):
- Use project accent color for primary data series
- Muted grid lines (`stroke="#f0f0f0"`)
- Responsive containers with fixed heights
- Dual Y-axis for multi-metric charts

**Tables**:
- Full-width layout (`table-fixed`, NO `overflow-x-auto`)
- Compact padding (`px-4 py-3`)
- Sortable column headers with visual indicator
- Null-safe rendering: `{user.lastActive ? formatDate(user.lastActive) : '\u2014'}`
- Null-safe sorting: `const aVal = a[sortField] ?? '';`

### Dashboard Layout
```
[Header: "Analytics" + DateRangePicker]
[4 KPI Cards in responsive grid]
[2 Charts side-by-side: Active Users + Requests/Response Time]
[Feature Usage Chart - full width]
[User Activity Table - full width]
```

The table MUST be full-width (not in a 2-column grid) to show all columns without horizontal scrolling.

---

## Step 9: Route + Navigation

### Add route in App.tsx
```tsx
<Route path="/analytics" element={
  <AdminRoute><ProtectedRoute><Layout><AnalyticsPage /></Layout></ProtectedRoute></AdminRoute>
} />
```

### Add link in Navbar
Add to admin dropdown (NOT sidebar). Use `BarChart3` icon from lucide-react.

---

## Common Pitfalls (Learned from Code Review)

| Pitfall | Solution |
|---------|----------|
| Frontend sends camelCase query params, backend expects snake_case | Transform at axios boundary: `{ start_date: params.startDate }` |
| `ondelete="SET NULL"` on `nullable=False` column | Use `ondelete="CASCADE"` for non-nullable FKs |
| `try/catch` around non-awaited promises | Use `.catch(() => {})` pattern instead |
| `userId` typed as `string` but backend returns `int` | Use `number` in TypeScript |
| `lastActive` typed as required but backend returns `null` | Make optional with `?` and add null guards |
| Date parsing throws unhandled `ValueError` | Wrap in try/except, return HTTP 400 |
| Table in 2-column grid causes horizontal scroll | Give table full width, use `table-fixed` |

---

## Verification Checklist

1. Backend starts without import errors
2. `GET /api/admin/analytics/overview` returns zeros with admin JWT
3. Make API calls, then check overview - request counts increment
4. Navigate app, check `/analytics` - page views and sessions populate
5. Non-admin gets 403 on analytics endpoints
6. Frontend TypeScript compiles with zero errors
7. `npm run build` succeeds
