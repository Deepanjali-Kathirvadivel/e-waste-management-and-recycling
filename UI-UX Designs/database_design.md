# Database Schema Design (v3)

## 1. User & Access Control
### Table: `admins`
| Column | Type | Constraints |
| :--- | :--- | :--- |
| id | UUID | PK, DEFAULT gen_random_uuid() |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | TEXT | NOT NULL |
| full_name | VARCHAR(100) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

### Table: `employees`
| Column | Type | Constraints |
| :--- | :--- | :--- |
| id | UUID | PK, DEFAULT gen_random_uuid() |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | TEXT | NOT NULL |
| full_name | VARCHAR(100) | NOT NULL |
| assessments_count | INT | DEFAULT 0 |
| admin_id | UUID | FK -> admins.id |

## 2. Product & Catalog
### Table: `product_catalog`
- Standardized product references.
- **Cols:** `id (PK)`, `brand`, `model_name`, `category`, `base_reuse_value`, `base_ewaste_value`.

### Table: `product_identifications`
- Stores AI identification events.
- **Cols:** `id (PK)`, `assessment_id (FK)`, `predicted_category`, `confidence_score`, `raw_ai_metadata (jsonb)`.

## 3. Assessments (Operational)
### Table: `assessments`
| Column | Type | Constraints |
| :--- | :--- | :--- |
| id | UUID | PK |
| employee_id | UUID | FK -> employees.id |
| image_url | TEXT | NOT NULL |
| status | ENUM | PENDING, COMPLETED |

### Table: `assessment_details`
- Physical/Functional audit results.
- **Cols:** `id (PK)`, `assessment_id (FK)`, `physical_condition (ENUM)`, `functional_status (JSONB)`, `missing_parts (JSONB)`.

### Table: `assessment_results`
- Final decision and values.
- **Cols:** `id (PK)`, `assessment_id (FK)`, `is_recyclable (BOOL)`, `suggested_value`, `ewaste_value`.

## 4. Forecasting & Sustainability (Strategic)
### Tables: `sales_data`, `import_data`, `population_data`
- Separate historical datasets per region and year.

### Table: `sustainability_scores`
| Column | Type | Constraints |
| :--- | :--- | :--- |
| id | UUID | PK |
| region_id | UUID | FK -> regions.id |
| score | DECIMAL(5,2) | |
| environmental_index | DECIMAL(5,2) | |
| logistics_index | DECIMAL(5,2) | |
| calculated_at | TIMESTAMP | |

### Table: `recommendations` & `recommendation_actions`
- Tracking the lifecycle from `Generated` → `Completed`.
