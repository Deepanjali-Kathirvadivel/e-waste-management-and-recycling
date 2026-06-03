# Updated Technical Architecture & Operational Blueprint: Smart E-Waste Enterprise (v3)

## 1. Revised Organizational Hierarchy
The platform now acknowledges **Coimbatore** as the strategic and operational nexus.

### Hierarchy
1. **ROOT (Coimbatore Head Office)**
   - Global Oversight, Admin Management, Strategic Reporting.
2. **CENTRAL PROCESSING HUB (Coimbatore)**
   - The primary destination for all e-waste material recovery.
3. **ADMINS (Regional)**
   - Divided by state: **Tamil Nadu Admin** and **Kerala Admin**.
4. **COLLECTION CENTERS (Local Nodes)**
   - **Tamil Nadu:** Chennai, Salem, Trichy.
   - **Kerala:** Kochi.
5. **PROCESSING FACILITIES (Infrastructural Nodes)**
   - Specialized units (Preprocessing, Dismantling, Material Recovery) generated via Sustainability Recommendations.

---

## 2. Updated Database Schema (Relational Additions)

### A. Infrastructure & Logistics
*   **`processing_facilities`**: `id, admin_id (FK), facility_name, facility_type (PREPROCESSING/DISMANTLING/RECOVERY), location, capacity (MT/day), status (OPERATIONAL/MAINTENANCE)`.
*   **`center_distances`**: `id, from_center_id (FK), to_center_id (FK), distance_km, base_transportation_cost_per_km`.
    - *Initial Network:* Chennai ↔ CBE, Salem ↔ CBE, Trichy ↔ CBE, Kochi ↔ CBE.

### B. Inventory & Logistics Management
*   **`inventory`**: `id, center_id (FK), facility_id (FK), product_category, quantity, reusable_value (₹), ewaste_value (₹), last_updated`.
*   **`transfers`**: `id, source_id (FK), destination_id (FK), status (PENDING/IN_TRANSIT/COMPLETED), volume, manifest_url`.

---

## 3. Sustainability Engine Logic (Distance-Based)
The Recommendation Hub now utilizes the `center_distances` table to trigger infrastructural alerts:
- **New Collection Center:** Triggered if distance from nearest node > 250 km.
- **New Preprocessing Unit:** Triggered if distance to Central Hub > 550 km.
- **Facility Expansion:** Triggered if local center throughput > 85% capacity threshold.
- **Logistics Optimization:** Triggered if `transportation_cost` > 15% of `ewaste_value`.

---

## 4. Operational Workflows
1. **Intake:** Product received at Collection Center (e.g., Trichy).
2. **Assessment:** Employee performs CV Scan and Audit.
3. **Inventory:** Item logged as Reusable or E-Waste.
4. **Transfer:** E-Waste bundled and shipped to **Coimbatore Central Processing Hub** once shipment volume threshold is met.
5. **Recovery:** Final material extraction at Central Processing Hub or Regional Preprocessing Facility.