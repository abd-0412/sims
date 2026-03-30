
# Pro-Stock IMS: Enterprise-Grade Logistics Terminal

## 📊 Overview
**Pro-Stock IMS** is a high-performance, full-stack Inventory Management System designed to provide a "Single Source of Truth" for supply chain operations. Built as a college-level mini project, it demonstrates a professional architecture using **React** for the frontend, **Node.js/Express** as a middleware bridge, and **MySQL** (via XAMPP) for persistent data storage.

---

## ⚙️ Installation & Setup Guide

### Phase 1: Database Setup (XAMPP)
1. Open **XAMPP Control Panel**.
2. Start **Apache** and **MySQL**.
3. Go to `http://localhost/phpmyadmin`.
4. Create a new database named `inventory_db`.
5. Import the `db_init.sql` file provided in the project root.

### Phase 2: Backend Bridge (Node.js)
1. Open your terminal.
2. **CRITICAL**: Navigate to your project folder:
   `cd path/to/your/project_folder`
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the backend server:
   ```bash
   npm run server
   ```
   *Note: Keep this terminal open while using the app.*

### Phase 3: Frontend Execution
1. Open a **second** terminal window.
2. Navigate to the same project folder.
3. Run the development server:
   ```bash
   npm start
   ```
4. Access the terminal at the URL shown (usually `http://localhost:5173`).

---

## 🔑 Access Tiers & Credentials

| Tier | Email Identity | Default Key |
| :--- | :--- | :--- |
| **Admin** | `admin@prostock.io` | `Admin@123` |
| **Manager** | `manager@prostock.io` | `Admin@123` |
| **Staff** | `staff@prostock.io` | `Admin@123` |

---

## 🛠 Features
- **Real-time Analytics**: Dashboard with stock trends and category mix.
- **Role-Based Access**: Specialized views for Admin, Manager, and Staff.
- **Audit Ledger**: Every action is tracked for accountability.
- **SQL Persistence**: Full MySQL integration for permanent data storage.
