# Updated Product Architecture: Smart E-Waste Intelligence (Enterprise v2)

## 1. System Architecture
The platform has transitioned from a dual-role system to a **Hierarchical Multi-Tenant Architecture**. This enables centralized oversight from the Coimbatore Head Office (Root) while delegating regional management to Admins and operational execution to Collection Centers and Employees.

### Core Modules
*   **Root Global Hub:** High-level configuration, inter-state analytics, and global sustainability auditing.
*   **Regional Admin Cluster:** Management of assigned collection centers, local forecasting, and recommendation implementation.
*   **Collection Center Node:** Inventory management, local throughput tracking, and staff oversight.
*   **Employee Assessment Hub:** High-frequency data capture and AI-driven product evaluation.

---

## 2. Updated User Hierarchy
1.  **Root (System Owner):** Based in Coimbatore HO. Controls the entire grid (TN & Kerala).
2.  **Admin (Regional Manager):** Manages a specific cluster of centers (e.g., North TN, Central Kerala).
3.  **Collection Center (Node Manager):** Manages a physical site (e.g., Trichy Center, Kochi Center).
4.  **Employee (Field Agent):** Executes the "Scan-to-Value" operational workflow.

---

## 3. Updated Database Schema (Relational PostgreSQL)

### A. Organization & Access
*   **`root_users`**: `id, email, password_hash, full_name, ho_location (Coimbatore)`.
*   **`admins`**: `id, root_id (FK), email, assigned_region (TN/KL), full_name`.
*   **`collection_centers`**: `id, admin_id (FK), center_name, state, city, manager_name, status`.
*   **`employees`**: `id, collection_center_id (FK), email, full_name, status`.

### B. Operations
*   **`assessments`**: `id, employee_id (FK), collection_center_id (FK), product_id (FK), status`.
*   **`inventory`**: `id, center_id (FK), product_category, quantity, total_estimated_value`.

---

## 4. Navigation Structure

### Root User (Head Office)
*   **Global Overview** (Dashboard)
*   **Center Management** (Directory of all 5 centers)
*   **User Management** (Admins & Center Managers)
*   **Strategic Forecasting** (State-wide trends)
*   **Global Reports** (Exportable sustainability audits)
*   **System Settings**

### Collection Center (Local Manager)
*   **Center Dashboard** (Daily stats & local KPIs)
*   **Inventory Ledger** (Stock levels & local value)
*   **Team Ops** (Employee management & productivity)
*   **Local Reports** (Daily/Weekly collection logs)

---

## 5. User Journeys (Revised)
*   **Root:** Login → View Global Revenue (₹) → Inspect Kerala Hub Performance → Provision new center in Madurai.
*   **Center Manager:** Login → Check Daily Collection Quota → Verify Employee throughput → Update Inventory status.
