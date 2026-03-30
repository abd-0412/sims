# Smart Inventory Management System (SIMS)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

> **"An intelligent, secure, and analytics-driven inventory management dashboard."**

---

> **Version:** 1.1.0  
> **Type:** Full-Stack Inventory Management System  
> **Design System:** Industrial Command (Neo-Brutalist Light Mode)  
> **Last Updated:** March 30, 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Folder Structure](#4-folder-structure)
5. [How to Run the Project](#5-how-to-run-the-project)
6. [Backend — Node.js / Express Server](#6-backend--nodejs--express-server)
7. [Database — MongoDB](#7-database--mongodb)
8. [Frontend — React + Vite](#8-frontend--react--vite)
9. [Pages & Modules](#9-pages--modules)
10. [User Roles & Permissions](#10-user-roles--permissions)
11. [Data Models / Types](#11-data-models--types)
12. [Context & State Management](#12-context--state-management)
13. [UI Component Library](#13-ui-component-library)
14. [Design System — Industrial Command](#14-design-system--industrial-command)
15. [Authentication Flow](#15-authentication-flow)
16. [API Endpoints](#16-api-endpoints)
17. [Default Login Credentials](#17-default-login-credentials)
18. [Production Reliability Layer](#18-production-reliability-layer)
19. [Known Issues & Notes](#19-known-issues--notes)
20. [Deployment](#20-deployment)
21. [UI Preview](#21-ui-preview)

---

## 1. Project Overview

**Smart Inventory Management System (SIMS)** is a full-stack, enterprise-grade Inventory Management System (IMS) built for warehouse and supply chain operations. It allows businesses to:

- Track products and their current stock levels in real time
- Process inbound and outbound stock transactions
- Manage product categories and supplier organization
- Control access through a multi-role permission system (Admin, Manager, Staff)
- Export reports as CSV files
- Maintain full audit logs of every action taken by every user

The system is built as a **Single Page Application (SPA)** on the frontend using React, communicating with a **Node.js + Express REST API** on the backend, backed by a **MongoDB** database.

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.0.0 | UI framework |
| TypeScript | (via Vite) | Type safety |
| Vite | 6.0.3 | Build tool & dev server |
| TailwindCSS | 3.4.16 | Utility-first styling |
| Framer Motion | 12.35.2 | Animations & transitions |
| React Router DOM | 7.1.0 | Client-side routing |
| Recharts | 2.15.0 | Dashboard charts |
| Axios | 1.7.9 | HTTP API calls |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | (LTS) | Runtime environment |
| Express | 4.18.2 | REST API framework |
| Mongoose | 9.3.0 | MongoDB ODM |

### Database
| Technology | Purpose |
|---|---|
| MongoDB | Primary database — stores all users, products, categories, transactions, and audit logs |

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────┐
│              BROWSER (React SPA)              │
│  ┌─────────────────────────────────────────┐ │
│  │   React Router (BrowserRouter)          │ │
│  │   InventoryContext (Global State)       │ │
│  │   UIContext (Toast / Loading)           │ │
│  │   Pages → Components → UIComponents    │ │
│  └─────────────────────────────────────────┘ │
│                    │ Axios HTTP               │
└────────────────────┼─────────────────────────┘
                     │
          ┌──────────▼───────────┐
          │  Node.js + Express   │
          │  REST API (Port 5000)│
          │  JWT Middleware       │
          └──────────┬───────────┘
                     │ Mongoose ODM
          ┌──────────▼───────────┐
          │   MongoDB Database   │
          │   (localhost:27017)  │
          └──────────────────────┘
```

- The **frontend** runs on `http://localhost:5173` (Vite dev server)
- The **backend API** runs on `http://localhost:5000`
- The **database** runs locally on `mongodb://localhost:27017/inventory_db`

---

## 5. How to Run the Project

### Prerequisites
- Node.js (LTS) installed
- MongoDB installed and running locally
- A terminal / command prompt

### Step 1 — Install Dependencies
```bash
npm install
```

### Step 2 — Start the Backend Server
Open a **separate terminal** and run:
```bash
node server.js
```
The API server will start on `http://localhost:5000`. On first run, MongoDB is automatically seeded with sample categories, products, and user accounts.

### Step 3 — Start the Frontend Dev Server
In your **main terminal**, run:
```bash
npm start
```
The app will open at `http://localhost:5173`.

---

## 17. Default Login Credentials

These accounts are automatically created on first database startup:

| Role | Username | Password |
|---|---|---|
| Admin | `admin@sims.io` | `Admin@123` |

---

## 18. Production Reliability Layer

### Security & Authentication
- **JWT Authentication** — Real signed JSON Web Tokens (JWT) are used for session management. Tokens expire in 8 hours.
- **Password Hashing** — All user passwords are saved using the `bcryptjs` adaptive hashing algorithm with 10 salt rounds.
- **Authorization (RBAC)** — Strict Role-Based Access Control via `verifyToken` and `requirePermission()` middlewares. 

---

## 20. Deployment

To deploy this system to a production-ready environment, follow these steps:

### Frontend (SPA)
- **Deployment Platform:** Vercel or Netlify
- **Build Commands:**
  ```bash
  npm install
  npm run build
  ```
- **Static Output:** `dist/` directory

### Backend (Node.js API)
- **Deployment Platform:** Render or Railway
- **Environment Variables Required:**
  - `MONGODB_URI`: Connection string for your MongoDB Atlas cluster.
  - `JWT_SECRET`: A long, unique string for signing tokens.
  - `PORT`: Set to `5000` or the platform's default port.
- **Execution Command:** `node server.js`

### Database
- **Platform:** MongoDB Atlas (Cloud)
- Create a Cluster and add your backend's IP to the whitelist.

---

## 21. UI Preview

### Login & Access
![Login Preview](./screenshots/login.png)
*Professional access portal with AES-256 encryption messaging.*

### Intelligent Dashboard
![Dashboard Preview](./screenshots/dashboard.png)
*Real-time multi-vector diagnostics and predictive inventory audits.*

### Managed Assets (Products)
![Products Preview](./screenshots/products.png)
*SKU-level tracking with intelligent stock status badges.*

### Analytics & Reports
![Reports Preview](./screenshots/reports.png)
*Visual performance metrics and CSV data export terminal.*

### Infrastructure Management (Warehouses)
![Warehouses Preview](./screenshots/warehouses.png)
*Capacity monitoring across multiple distribution nodes.*

---

*Smart Inventory Management System (SIMS) — Industrial Command — v1.1.0*
