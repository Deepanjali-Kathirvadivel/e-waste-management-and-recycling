# Smart E-Waste Platform: Technical Architecture & Backend Blueprint

## 1. Database Architecture (ERD Structure)

The system utilizes a relational database (PostgreSQL) to maintain data integrity across complex forecasting and assessment relationships.

### A. Core Tables & Schema

#### 1. User & Access Control
- `users`: `id (PK)`, `email (unique)`, `password_hash`, `full_name`, `role (enum: ADMIN, EMPLOYEE)`, `created_at`, `updated_at`.

#### 2. Assessment Module
- `products`: `id (PK)`, `brand`, `model_name`, `category`, `base_reusable_value`, `base_ewaste_value`.
- `assessments`: `id (PK)`, `employee_id (FK)`, `product_id (FK)`, `image_url`, `status (enum: PENDING, COMPLETED)`, `created_at`.
- `assessment_details`: `id (PK)`, `assessment_id (FK)`, `physical_condition`, `functional_status`, `missing_components (jsonb)`, `repair_history`, `quality_score`.
- `assessment_results`: `id (PK)`, `assessment_id (FK)`, `is_recyclable (boolean)`, `final_value_suggestion`, `final_ewaste_value`, `confidence_score`.

#### 3. Forecasting Module
- `regional_stats`: `id (PK)`, `region_name`, `population`, `year`, `import_volume`, `sales_volume`.
- `forecast_models`: `id (PK)`, `admin_id (FK)`, `model_type (enum: B2B, CONSUMER)`, `parameters (jsonb)`, `created_at`.
- `predictions`: `id (PK)`, `model_id (FK)`, `region_id (FK)`, `target_year`, `predicted_volume`, `trend_index`.

#### 4. Sustainability & Infrastructure
- `sustainability_data`: `id (PK)`, `region_id (FK)`, `carbon_footprint_index`, `current_capacity`, `logistics_score`.
- `recommendations`: `id (PK)`, `type (enum: PREPROCESSING, COLLECTION, LOGISTICS, FACILITY)`, `region_id (FK)`, `title`, `description`, `impact_score`, `status (enum: PLANNED, ACTIVE, ARCHIVED)`.

---

## 2. API Architecture (RESTful)

### A. Authentication & User Management
- `POST /api/v1/auth/login`: Authenticates user and returns JWT + Role.
- `GET /api/v1/users/profile`: Retrieves current user details.
- `POST /api/v1/admin/employees`: (Admin Only) Create new employee credentials.

### B. Assessment Flow (Operational)
- `POST /api/v1/assessments/upload`: Receives multipart image, triggers CV pipeline, returns `image_url` and `temp_id`.
- `POST /api/v1/assessments/identify`: Triggers CV identification. Request: `{ image_url }`. Response: `{ product_id, confidence }`.
- `POST /api/v1/assessments/submit`: Finalizes assessment. Request: `{ assessment_details, product_id, is_recyclable }`.
- `GET /api/v1/assessments/history`: Retrieves searchable assessment logs.

### C. Strategic Planning (Admin)
- `POST /api/v1/forecasts/generate`: Triggers ML forecasting. Request: `{ regions[], timeframe, model_type }`.
- `GET /api/v1/sustainability/recommendations`: Fetches AI-generated infrastructure suggestions.
- `PATCH /api/v1/sustainability/regions/:id`: Updates regional master data.

---

## 3. AI Service Architecture & Pipelines

### 1. Computer Vision (CV) Pipeline
`Image Buffer` → `Preprocessing (Resize/Normalize)` → `Object Detection (YOLOv8)` → `Feature Extraction` → `Softmax Classifier (Brand/Model Identification)` → `Confidence Thresholding` → `Output: Metadata`.

### 2. Decision Support Pipeline
`Condition Audit Data` + `Component Check` → `Heuristic Scoring Engine` → `Decision Logic (Threshold-based)` → `Output: Recycle Path (TRUE/FALSE)`.

### 3. Forecasting Pipeline
`Historical Time-Series Data` + `Population/Sales Regressors` → `Ensemble Model (Prophet + XGBoost)` → `Trend Decomposition` → `Output: Predictive Volume Map`.

---

## 4. System & Deployment Architecture

### A. Infrastructure Stack
- **Frontend:** React.js / Tailwind CSS (Vercel).
- **API Gateway:** Node.js / Express (Dockerized on AWS ECS).
- **AI Services:** Python / FastAPI (GPU-optimized instances/Lambda).
- **Primary Database:** PostgreSQL (AWS RDS).
- **Object Storage:** AWS S3 (for assessment imagery).
- **Cache/Queue:** Redis (for async AI processing tasks).

### B. Communication Flow
1. **Frontend** sends image to **API Gateway**.
2. **API Gateway** persists image to **S3** and pushes job to **Redis Queue**.
3. **AI Service** consumes job, runs CV Pipeline, and updates **PostgreSQL**.
4. **Gateway** sends WebSocket notification to **Frontend** with results.
