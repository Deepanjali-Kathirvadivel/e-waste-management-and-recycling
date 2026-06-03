# API Specification (RESTful)

## 1. Authentication
- `POST /api/v1/auth/login`: Authenticates either Admin or Employee (auto-detection).
- `GET /api/v1/auth/me`: Validates JWT and returns role/profile.

## 2. Employee Operations
- `POST /api/v1/assessments/upload`: 
  - **Payload:** `multipart/form-data (image)`.
  - **Response:** `assessment_id`, `s3_url`.
- `POST /api/v1/assessments/:id/audit`: 
  - **Payload:** `{ condition: "GOOD", functional_status: { screen: true, battery: false } }`.
- `GET /api/v1/assessments/history`: Filterable list of employee's own scans.

## 3. Forecasting (Admin)
- `GET /api/v1/forecast/models`: List available ML models.
- `POST /api/v1/forecast/generate`: 
  - **Payload:** `{ region_id, target_year, datasets: ["sales", "import"] }`.
  - **Logic:** Triggers async AI worker.
- `GET /api/v1/forecast/results/:id`: Retrieves predicted volume and trends.

## 4. Sustainability & Recommendations
- `GET /api/v1/sustainability/dashboard`: Aggregate scores per region.
- `PATCH /api/v1/recommendations/:id/status`: 
  - **Payload:** `{ status: "APPROVED" | "IMPLEMENTED" }`.
- `GET /api/v1/recommendations`: Filterable by status and type.

## 5. Global Search & Export
- `GET /api/v1/reports/export`: Returns CSV/PDF of assessment or sustainability data.
