# UI/UX Specification: Smart E-Waste Reusability & Sustainability Platform

## 1. Design System: Eco-Industrial Genesis (Refined)

### 1.1 Color Palette
- **Primary (Sustainability):** Emerald Green (`#064e3b` / `#10b981`)
- **Secondary (Industrial):** Slate Gray (`#334155` / `#64748b`)
- **Background:** Surface (`#f8fafc`), Surface-Bright (`#ffffff`)
- **Semantic:** 
  - Success (Reuse): `#10b981`
  - Warning (Audit): `#f59e0b`
  - Danger (Recycle): `#ef4444`

### 1.2 Typography (Inter)
- **Display:** 36px/44px, Bold (Dashboards KPIs)
- **Heading 1:** 24px/32px, Semibold (Page Titles)
- **Heading 2:** 18px/26px, Semibold (Section Headers)
- **Body:** 14px/20px, Regular (General Content)
- **Small:** 12px/16px, Medium (Labels, Metadata)

---

## 2. Navigation Structure

### 2.1 Admin Sidebar (Strategic)
1. **Executive Dashboard** (Icon: LayoutDashboard)
2. **Forecasting Center** (Icon: LineChart)
   - Analytics Dashboard
   - Data Management (Sales/Import/Pop)
3. **Sustainability Planner** (Icon: Leaf)
   - Infrastructure Insights
   - Regional Data Master
4. **Operations Control** (Icon: Users)
   - Employee Management
   - Global Audit Logs
5. **System Settings** (Icon: Settings)

### 2.2 Employee Sidebar (Operational)
1. **Ops Dashboard** (Icon: LayoutDashboard)
2. **New Assessment** (Icon: ScanLine)
3. **Assessment History** (Icon: History)
4. **Support** (Icon: LifeBuoy)

---

## 3. Screen Specifications

### 3.1 Authentication: Login Page
- **Purpose:** Secure role-based gateway.
- **Layout:** Split-screen (Left: Industrial e-waste imagery; Right: Centered form).
- **Components:**
  - `Logo`: "Smart E-Waste" (Emerald/Slate).
  - `Input`: Email (with Icon), Password (with Visibility toggle).
  - `Checkbox`: "Remember Me".
  - `Button`: Primary "Login".
  - `Link`: "Forgot Password?".

### 3.2 Admin: Executive Dashboard
- **Purpose:** 10,000ft view of global metrics.
- **Layout:** Grid-based (KPI Row -> Charts -> Tables).
- **KPI Cards:** Total Assessments, Reuse Rate (%), E-Waste Tonnes, Sustainability Score.
- **Charts:** 
  - `Line`: E-Waste Forecast Trends (12 months).
  - `Donut`: B2B vs. Consumer source distribution.
- **Tables:** Recent Assessments (top 5), Active Sustainability Recommendations.

### 3.3 Admin: Forecasting Results
- **Purpose:** Detailed predictive modeling.
- **Components:**
  - `Filter Bar`: Region, Timeframe, Product Category.
  - `Main Chart`: Forecast vs. Historical Data (Stacked Area).
  - `Cards`: B2B Prediction Value, Consumer Growth Rate.
  - `Empty State`: "No data available. Upload Sales/Import data to generate forecast."

### 3.4 Admin: Sustainability Planner
- **Purpose:** Infrastructure recommendation engine.
- **Components:**
  - `Map Interface`: GIS-based view showing regional hotspots.
  - `Recommendation Cards`: "Proposed Preprocessing Unit in [Region]", "Route Optimization: +12% Efficiency".
  - `Action`: "Approve for Logistics" or "Mark as Planned".

### 3.5 Employee: Assessment Wizard (Multi-step)
- **Step 1 (Upload):** Large drag-and-drop zone for product images.
- **Step 2 (AI Detect):** Loading state with "AI is identifying product...". Displays identified category (e.g., "ThinkPad L14 Gen 2").
- **Step 3 (Audit Form):**
  - `Select`: Physical Condition (Excellent/Good/Fair/Poor).
  - `Checklist`: Functional Status (Power, Screen, Input, Battery).
  - `Textarea`: Missing Components/Notes.
- **Step 4 (Decision):** Split view: "Reuse Potential" vs "Recycle Path".
- **Step 5 (Result):** Final values displayed side-by-side with confidence scores.

### 3.6 Shared: Historical Logs
- **Purpose:** Auditable trail of all assessments.
- **Components:**
  - `Search`: Global text search.
  - `Filters`: Date range, Employee, Outcome (Reuse/Recycle), Region.
  - `Table`: ID, Image (Thumb), Product, Date, Value, Outcome.
  - `Export`: CSV/PDF download buttons.

---

## 4. Interaction & UI States

- **Loading States:** Shimmer/Skeleton screens for charts and tables. Spinning logo for CV analysis.
- **Empty States:** Clean illustrations with clear CTAs (e.g., "No assessments yet. Start your first scan.").
- **Feedback:** Toast notifications for successful uploads, data saves, and prediction completions.
- **Responsive:** Desktop-first with fluid grids. Mobile view collapses sidebar into a hamburger menu; tables transform into cards.

---

## 5. User Journey Flow (Employee)
1. **Login** -> **Ops Dashboard** -> **CTA: Start Scan** -> **Upload Image** -> **Verify AI Result** -> **Fill Condition Audit** -> **Submit** -> **View Result Summary** -> **Home**.