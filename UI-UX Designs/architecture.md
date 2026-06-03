# System Architecture & Technical Blueprint: Smart E-Waste Platform

## 1. High-Level Architecture
The platform follows a **Decoupled Micro-Architecture** pattern, separating the high-frequency operational Assessment Hub from the compute-intensive Forecasting and Sustainability engines.

### 1.1 Communication Flow
1. **Frontend (React)** communicates via **REST API** with the **Node.js Gateway**.
2. **Gateway** offloads heavy AI tasks (CV & Forecasting) to a **Redis Queue**.
3. **Python AI Workers** consume tasks from Redis, process via **YOLOv8** or **XGBoost**, and write results to **PostgreSQL**.
4. **WebSocket (Socket.io)** notifies the Frontend when async analysis is complete.

## 2. Frontend Architecture (React)
- **State Management:** Zustand (Global State) + React Query (Server State/Caching).
- **Routing:** React Router v6 with Role-Based Guarding (Admin vs. Employee).
- **UI Kit:** Tailwind CSS + Headless UI + ApexCharts.

## 3. Backend Architecture (Node.js/Express)
- **Controller Layer:** Request validation and response mapping.
- **Service Layer:** Business logic (e.g., scoring algorithms, decision trees).
- **Repository Layer:** Data access via Prisma ORM for type-safe PostgreSQL queries.
- **Middleware:** JWT Auth, Role-Check, Rate Limiting, File Upload (Multer).

## 4. AI Architecture
### 4.1 CV Pipeline
`S3 Image URL` → `Preprocessing` → `YOLOv8 Detection` → `ResNet Classification` → `Metadata Match (product_identifications)` → `Catalog Lookup`.

### 4.2 Forecasting Pipeline
`Historical Datasets` + `Ensemble Model (Prophet + XGBoost)` → `Trend Decomposition` → `Volume Prediction`.

## 5. Security Architecture
- **Auth:** JWT-based stateless authentication.
- **RBAC:** 
  - `ADMIN`: Full CRUD on Strategic/Regional data, User management.
  - `EMPLOYEE`: Create Assessments, View personal history.
- **Data Security:** AES-256 for sensitive metrics, S3 Private Buckets for imagery.

## 6. Deployment Stack
- **Frontend:** Vercel.
- **Backend APIs:** AWS ECS (Fargate).
- **AI Workers:** AWS Lambda (Lightweight) / ECS GPU Instances (Heavy).
- **Database:** AWS RDS (PostgreSQL).
- **Cache:** Redis Cloud.
- **Storage:** AWS S3.
