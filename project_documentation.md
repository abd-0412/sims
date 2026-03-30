# Pro-Stock IMS: Technical & Operational Blueprint

## 1. The Core Innovation: Dynamic IAM
Unlike basic projects that use hardcoded logins, Pro-Stock implements a **Dynamic Identity & Access Management (IAM)** system. 

### Why this matters:
- **Scalability**: The `LoginPage` dynamically queries the `pro_users` collection in LocalStorage.
- **Security**: Password hashing logic is simulated, and users can manage their own "Security Keys" via the **Profile Page**.
- **Auditability**: Every login and credential change triggers a system-wide Audit Log entry.

## 2. Operational Workflows

### A. The Admin Workflow (Setup)
1. Admin logs in and navigates to **Access Control**.
2. A new user is "Provisioned" (Created) with a specific role and temporary password.
3. The new user is now part of the system's "Source of Truth."

### B. The Operator Workflow (Daily Use)
1. Staff member logs in with their unique credentials.
2. They perform **Stock IN** (Receiving) or **Stock OUT** (Sales/Damage).
3. They visit their **Profile Hub** to track their personal activity stats and update their password for better security.

### C. The Management Workflow (Analytics)
1. Managers use the **Intelligence Reports** to see which items are "Critical" (Low Stock).
2. They export these reports to PDF/Excel for physical meetings.

## 3. Data Integrity Rules
- **Negative Stock Prevention**: The system will block any "Stock OUT" transaction that exceeds the current on-hand balance.
- **SKU Uniqueness**: No two products can share the same SKU code, preventing catalog duplication errors.
- **Session Persistence**: Using `localStorage` hooks, the system maintains the "Current User" session state, ensuring a smooth UX across page refreshes.

## 4. Design Philosophy: "Clean & Kinetic"
The UI uses a **40px corner radius** and **Glassmorphism** effects to provide a high-end, premium feel. Animation transitions (`animate-in`, `fade-in`) are used to reduce cognitive load on the user during screen changes.