# Frontend Architecture Specification: Smart E-Waste Intelligence Platform (v1.0)

## 1. Project Overview
A multi-tenant, role-based React application designed to manage e-waste operations across Tamil Nadu and Kerala. The architecture prioritizes performance, scalability, and strict permission-based routing.

## 2. Technical Stack
- **Framework:** React 18+ (Vite)
- **Styling:** Tailwind CSS (following {{DATA:DESIGN_SYSTEM:DESIGN_SYSTEM_1}})
- **State Management:** Zustand (Global State) + TanStack Query (Server State)
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod (Validation)
- **Charts:** ApexCharts / Recharts
- **Icons:** Lucide React

---

## 3. Frontend Route Structure (RBAC)

### Public Routes
- `/login` (Unified gateway with role-detection)
- `/forgot-password`
- `/reset-password`

### Root User Portal (`/root`)
- `/root/dashboard` (Global Command Center)
- `/root/centers` (Center Management & Directory)
- `/root/admins` (Regional Admin Management)
- `/root/forecasting` (Global Sustainability Trends)
- `/root/reports` (Consolidated Audits)
- `/root/settings` (System Configuration)

### Admin Portal (`/admin`)
- `/admin/dashboard` (Regional Overview)
- `/admin/forecasting` (Trend Analysis & Data Input)
- `/admin/sustainability` (Recommendation Center)
- `/admin/employees` (Staff Management)
- `/admin/reports` (Regional Logs)

### Collection Center Portal (`/center`)
- `/center/dashboard` (Operational Overview - e.g., Trichy Node)
- `/center/inventory` (Reusable vs. E-Waste Stock Management)
- `/center/transfers` (Shipment Tracking to Coimbatore Hub)
- `/center/team` (Local Employee Performance)
- `/center/reports` (Daily Intake Logs)

### Employee Portal (`/employee`)
- `/employee/dashboard` (Daily Tasks & KPIs)
- `/employee/assessment/new` (Multi-step CV Scan Wizard)
- `/employee/history` (Personal Assessment Log)
- `/employee/profile` (Account Settings)

---

## 4. Component Architecture

### Core Layouts
- `MainLayout`: Wrapper for authenticated routes, including persistent Sidebar and TopNav.
- `AuthLayout`: Centered/Split-screen layouts for login flows.

### Shared UI Components
- **Navigation:** `SideNavBar`, `TopNavBar`, `Breadcrumbs`.
- **Data Display:** `KPICard`, `DataTable` (with sorting/filtering), `ChartContainer`, `StatusBadge`.
- **Feedback:** `ToastNotification`, `LoadingSkeleton`, `EmptyStateContainer`.

### Module-Specific Components
- **Assessment:** `AssessmentWizard` (Stepper), `CVResultCard`, `ConditionAuditForm`.
- **Sustainability:** `RecommendationCard`, `GISMapView`, `ImpactMetric`.
- **Logistics:** `ShipmentTracker` (Vertical Timeline), `RouteOptimizationAlert`.

---

## 5. Folder Structure (React + Vite)
```text
src/
├── api/                  # Axios instances & API service definitions
│   ├── auth.service.ts
│   ├── assessment.service.ts
│   ├── forecast.service.ts
│   └── inventory.service.ts
├── assets/               # Static assets (logos, images)
├── components/           # Atomic UI components
│   ├── ui/               # Base components (Buttons, Inputs)
│   ├── shared/           # Cross-module components (KPI cards, Tables)
│   └── layouts/          # AuthLayout, RootLayout, OpsLayout
├── hooks/                # Custom hooks (useAuth, useInventory, useDebounce)
├── pages/                # Screen implementations grouped by role
│   ├── root/             # Root Dashboard, Center Mgmt
│   ├── admin/            # Forecasting, Sustainability
│   ├── center/           # Inventory, Transfers
│   └── employee/         # Assessment Hub, History
├── routes/               # Route definitions & ProtectedRoute guards
├── store/                # Zustand global stores (useAuthStore, useThemeStore)
├── types/                # TypeScript interfaces & enums
├── utils/                # Helper functions (currency formatting, date parsing)
└── App.tsx               # Main entry & Provider setup
```

---

## 6. State Management Strategy

### Global State (Zustand)
- **`authStore`**: Manages JWT, user profile, and persistent login status.
- **`appStore`**: Manages sidebar collapse state, theme (light/dark), and global notifications.

### Server State (TanStack Query)
- **`useInventory`**: Caching and synchronization for center stock levels.
- **`useAssessments`**: Managing assessment history and pagination.
- **`useForecast`**: Handling heavy analytics data fetching.

---

## 7. API Integration & Form Architecture
- **API Pattern:** Service-based architecture using Axios interceptors for automatic JWT attachment and error handling.
- **Form Strategy:** 
  - **Assessment Wizard:** Multi-step form state synced to `sessionStorage` to prevent data loss on refresh.
  - **Validation:** Zod schemas shared with backend for consistent data integrity.

---

## 8. Implementation Roadmap (Sprint Priority)

| Sprint | Focus | Complexity | Target Screens |
| :--- | :--- | :--- | :--- |
| **1** | **Foundation & Auth** | Medium | Login, Route Guards, Basic Layouts |
| **2** | **Root & Admin Core** | High | Root Dashboard, Center Directory |
| **3** | **Employee Operations** | High | Assessment Wizard, CV Integration UI |
| **4** | **Center Operations** | Medium | Inventory Ledger, Shipment Tracking |
| **5** | **Strategic Intelligence**| High | Forecasting Analytics, Sustainability Recommendations |
| **6** | **Optimization & Reporting**| Medium | Global Reports, User Profiles |
| **7** | **QA & Final Polishing** | Low | Error Boundaries, Toast Feedback |
