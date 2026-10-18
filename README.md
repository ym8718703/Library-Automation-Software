# Library Management System (LMS)
### A Production-Ready Full-Stack Web Application Powered by MySQL 8.0 & InnoDB

---

## 1. Project Introduction & Objectives

The **Library Management System (LMS)** is a comprehensive full-stack enterprise web application designed for a collegiate or university library. The primary objective of this project is to provide a complete, practical, real-world demonstration of core **Relational Database Management System (DBMS)** concepts.

Rather than presenting an isolated frontend prototype or simulated mock data, **every single operation**—catalog management, circulation desk checkouts, book returns, overdue penalty assessments, partial/full fine payments, receipt printing, analytical reporting, and system settings—directly interacts with a live **MySQL 8.0** relational database running the **InnoDB** storage engine.

### Key DBMS Concepts Demonstrated
* **Relational Database Design & Normalization:** Strictly normalized schema targeting **Third Normal Form (3NF)** for operational tables.
* **Referential Integrity & Constraints:** Primary Keys, Foreign Keys with `ON DELETE RESTRICT` to preserve historical transaction audit trails, `UNIQUE` email and transaction constraints, and `CHECK` constraints on prices, pages, and copy quantities.
* **ACID Transactions & Concurrency Safety:** Explicit database transactions (`START TRANSACTION`, `COMMIT`, `ROLLBACK`) with row-level pessimistic locking (`SELECT ... FOR UPDATE`) preventing race conditions (e.g., two concurrent borrowers issuing the final available copy).
* **Stored Procedures:** Server-side stored procedures encapsulate complex multi-table workflows (`sp_IssueBook`, `sp_ReturnBook`, `sp_RecordFinePayment`, `sp_GetMemberBorrowingHistory`, `sp_GetOverdueBooks`).
* **Database Triggers:** Automated triggers enforce business invariants (preventing fine overpayments) and audit modifications into a persistent `BookAuditLog`.
* **Database Views:** Seven pre-compiled SQL views abstract multi-table joins and aggregations without Cartesian join explosion.
* **Complex SQL Queries:** Multi-table INNER/LEFT joins, ANSI aggregate functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`), `GROUP BY` with `HAVING` filters, correlated and non-correlated subqueries (`NOT IN`, `NOT EXISTS`, derived subqueries).
* **Secondary Indexing:** B-Tree indexing on high-frequency search and filter attributes for optimized sub-millisecond query execution.

---

## 2. Technology Stack

### Frontend
* **React 18** with **Vite**
* **JavaScript (ES Modules)**
* **Tailwind CSS** (Restrained corporate palette, subtle slate/sky accents, print stylesheet)
* **React Router v6** (Client-side routing across 12 modules)
* **Axios** (Centralized API client with response interception)
* **Recharts** (Interactive time-series area charts, circulation bar charts, and horizontal ranking charts)
* **Lucide React** (Consistent UI iconography)

### Backend
* **Node.js (v24+)** & **Express.js**
* **mysql2/promise** (High-throughput connection pooling with `multipleStatements` enabled)
* **Parameterized SQL Queries & Prepared Statements** (Guaranteed protection against SQL injection)
* **Centralized Express Error Handling Middleware** (Translates MySQL error codes: `ER_DUP_ENTRY`, `ER_ROW_IS_REFERENCED`, `ER_CHECK_CONSTRAINT_VIOLATED`, and custom `SQLSTATE 45000` signals)
* **Native Node.js Test Runner** (`node:test`, `node:assert`)

### Database
* **MySQL 8.0 Community Server**
* **InnoDB Storage Engine** (Row-level locking, foreign key integrity, crash recovery)
* **UTF-8 (utf8mb4 / utf8mb4_unicode_ci)** character collation

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   React 18 + Vite Frontend                   │
│   (Dashboard, Catalog, Circulation, Fines, Receipts, SQL)    │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTP / JSON REST APIs
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Express.js Backend API                    │
│   (Controllers, Routers, Input Validation, Error Handling)   │
└──────────────────────────────┬───────────────────────────────┘
                               │ mysql2 Connection Pool (Port 3306)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                   MySQL 8.0 (InnoDB Engine)                  │
│                                                              │
│  ┌──────────────────────┐         ┌───────────────────────┐  │
│  │   6 Core Relational  │         │   7 SQL Views         │  │
│  │   Tables             │         │   (No Cartesian Dup)  │  │
│  └──────────┬───────────┘         └───────────┬───────────┘  │
│             │                                 │              │
│  ┌──────────▼───────────┐         ┌───────────▼───────────┐  │
│  │   5 Stored           │         │   Database Triggers & │  │
│  │   Procedures (ACID)  │         │   Audit Trails        │  │
│  └──────────────────────┘         └───────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Entity-Relationship (ER) Model & Relational Schema

The core architecture directly models the six primary entities specified in the library domain model:

```
┌─────────────┐             ┌─────────────┐             ┌─────────────┐
│  Publisher  │ 1         N │    Books    │ 1         N │ BookIssued  │
│             ├─────────────┤             ├─────────────┤(Circulation)│
└─────────────┘             └─────────────┘             └──────┬──────┘
                                                               │
                                                               │ 1
                                                               │
┌─────────────┐             ┌─────────────┐                    │ N
│    Staff    │ 1         N │   Receipt   │ N                1 │
│             ├─────────────┤  (Ledger)   ├────────────────────┘
└──────┬──────┘             └──────┬──────┘
       │                           │
       │ 1                       N │
       │                           │
       │ N                         │ 1
┌──────▼──────┐             ┌──────▼──────┐
│ BookIssued  │             │   Member    │
│(Authorizes) │             │  (Patron)   │
└─────────────┘             └─────────────┘
```

### Relational Schema Summary

| Table | Primary Key | Foreign Keys | Key Constraints & Attributes |
|---|---|---|---|
| **`Publisher`** | `PublisherID` (INT AI) | None | `PublisherName` (VARCHAR(150), UNIQUE, NOT NULL), `CreatedAt` |
| **`Books`** | `ISBN` (VARCHAR(20)) | `PublisherID` &rarr; `Publisher.PublisherID` | `Title`, `AuthorName`, `Price` (CHECK &ge; 0), `NoOfPages` (CHECK &gt; 0), `Edition`, `TotalCopies` (CHECK &ge; 0), `AvailableCopies` (CHECK &ge; 0 AND &le; TotalCopies) |
| **`Staff`** | `StaffID` (INT AI) | None | `Name`, `Post`, `Email` (UNIQUE, NOT NULL), `ContactNo`, `Role` (ENUM), `IsActive` (BOOLEAN) |
| **`Member`** | `MemberID` (INT AI) | None | `Name`, `Email` (UNIQUE, NOT NULL), `ContactNo`, `MembershipStatus` (ENUM: 'Active','Suspended','Inactive'), `JoinDate`, `Address` |
| **`BookIssued`** | `IssueID` (INT AI) | `MemberID` &rarr; `Member`<br>`ISBN` &rarr; `Books`<br>`IssuedBy` &rarr; `Staff`<br>`ReturnedBy` &rarr; `Staff` | `IssueDate`, `DueDate` (CHECK &ge; IssueDate), `ReturnDate`, `Status` (ENUM: 'Issued','Returned','Lost'), `FineAmount`, `FinePaidAmount` |
| **`Receipt`** | `ReceiptID` (INT AI) | `MemberID` &rarr; `Member`<br>`StaffID` &rarr; `Staff`<br>`IssueID` &rarr; `BookIssued` | `TransactionID` (VARCHAR(50), UNIQUE), `TransactionType` (ENUM), `Amount` (CHECK &gt; 0), `PaymentMethod` (ENUM), `PaymentStatus` (ENUM), `TransactionDateTime` |
| **`Settings`** | `SettingKey` (VARCHAR(50)) | None | Key-value operational parameters (`max_books_per_member`, `loan_duration_days`, `daily_fine_rate`, `grace_period_days`) |
| **`BookAuditLog`**| `AuditID` (INT AI) | None | Trigger-managed change log tracking changes to `TotalCopies`, `AvailableCopies`, and `Price` |

---

## 5. Database Normalization Analysis

* **First Normal Form (1NF):** Every column stores single atomic values; repeating groups or comma-separated lists are eliminated. Every entity defines an unambiguous primary key.
* **Second Normal Form (2NF):** All tables have non-key attributes that are fully functionally dependent on their candidate keys (no partial key dependencies).
* **Third Normal Form (3NF):** All transitive dependencies are strictly eliminated:
  * Publisher metadata is decoupled from `Books`.
  * Staff profile data is decoupled from transaction logs in `BookIssued` and `Receipt`.
  * Member demographics exist solely in `Member`, referenced by foreign key in borrowing and payment tables.
* **Controlled Operational Denormalization (`AvailableCopies`):**
  To maintain blazing sub-millisecond catalog search response times without scanning millions of transaction logs on every HTTP request, `Books.AvailableCopies` is maintained as a real-time counter. Consistency is guarded via **ACID transactions with row-level locks (`FOR UPDATE`)** in `sp_IssueBook` and `sp_ReturnBook`.

---

## 6. Stored Procedures, Triggers & Views

### Stored Procedures (`database/procedures.sql`)
1. **`sp_IssueBook(p_MemberID, p_ISBN, p_StaffID, OUT p_IssueID, OUT p_DueDate, OUT p_StatusMessage)`**
   * Validates staff exists and is active.
   * Validates member exists and has `MembershipStatus = 'Active'`.
   * Enforces lending limit (`max_books_per_member` from `Settings`, default 3).
   * Locks the target book row with `SELECT ... FOR UPDATE`.
   * Checks `AvailableCopies > 0`.
   * Calculates due date dynamically based on `loan_duration_days`.
   * Decrements `AvailableCopies = AvailableCopies - 1`.
   * Inserts the new checkout row in `BookIssued`.
   * Commits atomically or issues a full rollback upon any violation.
2. **`sp_ReturnBook(p_IssueID, p_StaffID, OUT p_FineAssessed, OUT p_DaysOverdue, OUT p_StatusMessage)`**
   * Locks the target issue row with `FOR UPDATE`.
   * Prevents duplicate returns: rejects returns if status is not 'Issued'.
   * Calculates overdue duration via `DATEDIFF(CURDATE(), DueDate)`.
   * Applies daily fine rate (default ₹5.00/day) after subtracting grace period.
   * Updates `ReturnDate = CURDATE()`, `ReturnedBy = p_StaffID`, `Status = 'Returned'`, and records `FineAmount`.
   * Restores inventory: `UPDATE Books SET AvailableCopies = AvailableCopies + 1`.
   * Commits atomically.
3. **`sp_RecordFinePayment(p_IssueID, p_MemberID, p_StaffID, p_Amount, p_PaymentMethod, p_TransactionID, p_Remarks, OUT p_ReceiptID, OUT p_NewBalance, OUT p_StatusMessage)`**
   * Locks issue record and computes outstanding balance (`FineAmount - FinePaidAmount`).
   * Rejects overpayments where `p_Amount > OutstandingBalance`.
   * Creates receipt record in `Receipt` table.
   * Updates `FinePaidAmount = FinePaidAmount + p_Amount` on `BookIssued`.
   * Commits atomically.
4. **`sp_GetMemberBorrowingHistory(p_MemberID)`**
   * Returns complete member lending records, book details, staff names, and fine balances.
5. **`sp_GetOverdueBooks()`**
   * Returns all currently overdue loans with dynamically calculated penalties.

### Database Triggers (`database/triggers.sql`)
1. **`trg_Books_AfterUpdate` & `trg_Books_AfterInsert`:**
   * Automatically captures changes to `TotalCopies`, `AvailableCopies`, or `Price` and inserts an immutable audit entry into `BookAuditLog`.
2. **`trg_Receipt_BeforeInsert`:**
   * Database-level constraint trigger: if a receipt is inserted directly for an issue fine, it validates that `Amount <= (FineAmount - FinePaidAmount)`. If violated, it executes `SIGNAL SQLSTATE '45000'` with an explicit error message.

### Database Views (`database/views.sql`)
1. `vw_BookPublisherDetails`: Books joined with Publisher and stock categorization.
2. `vw_CurrentIssuedBooks`: Active borrowings with patron contact and staff details.
3. `vw_OverdueBooks`: Real-time overdue calculations using server `CURDATE()`.
4. `vw_MemberBorrowingHistory`: Complete borrowing history across tables.
5. `vw_FineOutstanding`: Borrowings with remaining unpaid fine balance.
6. `vw_ReceiptDetails`: Full receipt audit records.
7. `vw_StaffActivity`: Workload summary aggregated via subqueries to prevent Cartesian multiplication.

---

## 7. Web Application Modules

| Module | Route | Key Features & Implementation |
|---|---|---|
| **Dashboard** | `/` | 9 real-time KPI metrics from MySQL, monthly issuance area chart, monthly fine collections trend, top 5 most borrowed books, publisher breakdown, recent activity feed. |
| **Books** | `/books` | Search by title/author/ISBN, filter by publisher and availability, sort by price/title/copies, pagination, Add/Edit modal with copy validation, View details with borrowing history, deletion protection. |
| **Publishers** | `/publishers` | Publisher directory, book counts per publisher, Add/Edit modal, view titles published, deletion protection (ON DELETE RESTRICT). |
| **Members** | `/members` | Member profiles, active borrowing counts, unpaid fines, status toggles (Active, Suspended, Inactive), full borrowing audit trail. |
| **Staff** | `/staff` | Staff roster, designations, performance metrics from `vw_StaffActivity`, Add/Edit modal, non-destructive deactivation preserving transaction history. |
| **Issue Book** | `/issue-book` | Guided circulation desk workflow: member eligibility check, real-time stock inspection, staff authorization, automatic due date calculation, instant execution via `sp_IssueBook`. |
| **Return Book** | `/return-book` | Active loan lookup, real-time overdue day and fine calculation (₹5/day), inventory restoration, duplicate return protection via `sp_ReturnBook`. |
| **Fine Management**| `/fines` | Filter by unpaid, partially paid, or fully settled; record partial or full fine settlements with overpayment protection; instant printable receipt generator. |
| **Receipts** | `/receipts` | Filterable transaction logs (UPI, Cash, Card), search by TransactionID, view official printable transaction slips with institutional branding. |
| **Reports** | `/reports` | 9 analytical reports with category tabs, summary KPI stats, dynamic table presentation, and one-click **CSV Export**. |
| **Database Explorer**| `/explorer` | 17 interactive SQL demonstration queries with live execution against MySQL, table schema inspector (`information_schema`), database objects viewer, and interactive ER diagram. |
| **Settings** | `/settings` | Configurable lending parameters: max active books, loan duration, daily fine rate, grace period, and institutional branding. |

---

## 8. Installation & Setup Instructions

### Prerequisites
1. **Node.js (v18+)** installed.
2. **MySQL Server 8.0+** running locally (or remotely) on default port `3306`.

### Step 1: Clone or Navigate to Project
```bash
cd "c:\Users\yashr\OneDrive\Desktop\Projects\Library Automation Software"
```

### Step 2: Configure Environment Variables
In `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=library_management
NODE_ENV=development
```

### Step 3: Initialize MySQL Database
Execute the database scripts in order using MySQL CLI or MySQL Workbench:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/indexes.sql
mysql -u root -p < database/views.sql
mysql -u root -p < database/procedures.sql
mysql -u root -p < database/triggers.sql
mysql -u root -p < database/seed.sql
```

### Step 4: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 5: Start the Application

**Terminal 1 (Backend Server):**
```bash
cd backend
npm run dev
# Starts backend server on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Starts Vite development server on http://localhost:5173
```

Open `http://localhost:5173` in any modern web browser.

---

## 9. Running Automated Tests

The application includes an automated test suite verifying constraints, stored procedures, transactions, and REST APIs directly against MySQL:

```bash
cd backend
npm test
```

### Verified Test Cases:
* `GET /api/health` system status & engine verification.
* `Publisher` CRUD operations and unique name constraint.
* `Books` CRUD operations, duplicate ISBN rejection, and negative price rejection.
* `Member` registration, successful book issuance (`sp_IssueBook`), and return (`sp_ReturnBook`).
* Rejection of duplicate book returns (preventing inventory inflation).
* Rejection of book checkouts for suspended members.
* Borrowing limit and copy exhaustion enforcement.
* Fine payment settlement and overpayment rejection.
* Predefined SQL queries execution via Database Explorer.
* Live analytical reports and dashboard statistics.

---

## 10. Summary of Implemented Features

 All 6 primary entities from the ER diagram implemented in MySQL 8.0 with InnoDB.
 Full ACID transaction protection and row-level locking (`SELECT ... FOR UPDATE`).
 Stored procedures (`sp_IssueBook`, `sp_ReturnBook`, `sp_RecordFinePayment`) handle core lending logic.
 Automated database triggers prevent overpayment and log catalog modifications.
 7 pre-compiled SQL views power reports without join explosion.
 17 predefined SQL queries with interactive browser execution.
 Comprehensive reports with CSV export.
 Responsive, professional user interface with zero broken buttons.
 Complete documentation and verified automated test suite.
