# Liliprovisions Ltd - User Training Manual

This manual is designed for developers or administrators to train new users on the Liliprovisions Ledger & Credit Index application. 

## 1. Introduction for All Users
The system is a unified platform for managing invoices, deliveries, client/supplier databases, and tracking logistical performance. The interface adapts based on your assigned **Role** (Super Admin, Admin, Delivery, Supplier).

### Basic Navigation (Mobile & Desktop)
- **Top Header:** Contains your assigned role and profile name.
- **Main View / Tabs:** Switch between sub-dashboards (Invoices, Partners, Analytics) using the tabbed navigation.
- **Quick Actions:** Floating action buttons (or Top Right header buttons) to create new entries depending on your permissions.

---

## 2. Training by Role

### A. Administrators (Admin & Super Admin)
*Admins hold the highest authority. They oversee full financial ledgers, system backups, and user management.*

**Key Training Points:**
1. **Invoice Management:** 
   - Click "New Invoice" to create a ledger entry. Fill in details, select clients/suppliers, and issue dates.
   - You can edit, delete, or mark invoices as 'Paid', 'Pending', 'Delivered', etc.
2. **Authority Control (User Management):** 
   - Click the **Authority Control** button (shield icon in the header) to open the user management drawer.
   - Here, you can onboard new users and assign them specific roles (Delivery, Supplier, Admin).
3. **Data Backups:** 
   - Scroll to the footer (desktop) to find the **Backup Data** and **Import Data** functions. Show them how to safely export JSON backups periodically.
4. **Partner Management:** 
   - Navigate to the **Clients** or **Suppliers** tabs to manage stakeholder databases and onboard new business partners.

### B. Delivery Personnel
*The delivery module is highly optimized for mobile devices. It allows drivers to view assigned dispatches, capture signatures, and upload scale photos.*

**Key Training Points:**
1. **Accessing Dispatches:**
   - When a delivery user logs in, they are immediately presented with the **Delivery Dashboard**.
   - Show them how to filter active dispatches (Pending vs. Delivered).
2. **Completing a Delivery:**
   - Tap on an active invoice to open its details. 
   - Scroll down to the **Final Weight Verification** section.
   - **Upload Photo:** Show them how to either use the camera for "Live Capture" (taking a photo of the scale) or upload an existing file.
   - **Signatures:** Walk them through capturing a digital signature from the recipient on the device screen, then saving the update.

### C. Suppliers
*Suppliers have limited access to view their own supply manifests and update supply weights.*

**Key Training Points:**
1. **Verifying Manifests:**
   - Suppliers will only see invoices relevant to their account.
   - Emphasize the importance of checking item quantities and expected supply dates.
2. **Weighing Documentation:**
   - Suppliers can also upload "Weighing Scale Documentation" prior to dispatch to log the starting biomass/weight.

---

## 3. General Troubleshooting for Users
- **"I can't see a specific tab":** Ensure the user understands that tabs are hidden if their role does not have authorization.
- **"The app won't capture my photo":** Have the user check their browser permissions for Camera access.
- **Offline / Restore Issues:** Remind Admins to only use "Restore System" (Reset) in emergencies, and to rely on periodic Backups.

---

*For further developer and codebase queries, consult the system architecture and React components (e.g., `src/App.tsx`, `src/components/RoleSelector.tsx`).*
