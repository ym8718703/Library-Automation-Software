# Entity-Relationship (ER) Mapping & Relational Schema Documentation

## 1. ER Diagram Translation & Normalization Analysis

The Library Management System is built upon six foundational entities derived from the college library ER model:

1. **Publisher** (1) ──< publishes >── (N) **Books**
2. **Member** (1) ──< borrows >── (N) **BookIssued**
3. **Books** (1) ──< is borrowed in >── (N) **BookIssued**
4. **Staff** (1) ──< issues >── (N) **BookIssued** (IssuedBy)
5. **Staff** (1) ──< returns >── (N) **BookIssued** (ReturnedBy)
6. **Member** (1) ──< makes payment >── (N) **Receipt**
7. **Staff** (1) ──< processes >── (N) **Receipt**
8. **BookIssued** (1) ──< generates fine >── (N) **Receipt**

---

## 2. Relational Schema & Table Specifications

### 2.1 `Publisher` Table
- **Primary Key:** `PublisherID` (INT AUTO_INCREMENT)
- **Candidate Key:** `PublisherName` (VARCHAR(150) UNIQUE NOT NULL)
- **Attributes:** `CreatedAt` (TIMESTAMP)
- **Normalization:** 3NF compliant. Publisher attributes depend only on `PublisherID`. Prevents insertion/deletion anomalies when cataloging books.

### 2.2 `Books` Table
- **Primary Key:** `ISBN` (VARCHAR(20)) - Uniquely identifies book edition.
- **Foreign Key:** `PublisherID` REFERENCES `Publisher(PublisherID)` ON DELETE RESTRICT ON UPDATE CASCADE.
- **Attributes:**
  - `Title` (VARCHAR(200) NOT NULL)
  - `AuthorName` (VARCHAR(150) NOT NULL)
  - `Price` (DECIMAL(10,2) CHECK (Price >= 0))
  - `NoOfPages` (INT CHECK (NoOfPages > 0))
  - `Edition` (VARCHAR(50))
  - `TotalCopies` (INT NOT NULL DEFAULT 0 CHECK (TotalCopies >= 0))
  - `AvailableCopies` (INT NOT NULL DEFAULT 0 CHECK (AvailableCopies >= 0 AND AvailableCopies <= TotalCopies))
- **Design Rationale for `AvailableCopies`:**
  To optimize real-time book queries without performing expensive full-table aggregation over millions of historical transactions on every page load, `AvailableCopies` is maintained as an operational inventory field. Database integrity is strictly enforced via ACID transactions and row-level locks (`SELECT ... FOR UPDATE`) in stored procedures.

### 2.3 `Staff` Table
- **Primary Key:** `StaffID` (INT AUTO_INCREMENT)
- **Candidate Key:** `Email` (VARCHAR(150) UNIQUE NOT NULL)
- **Attributes:**
  - `Name` (VARCHAR(150) NOT NULL)
  - `Post` (VARCHAR(100) NOT NULL)
  - `ContactNo` (VARCHAR(20) NOT NULL)
  - `Role` (ENUM('Admin', 'Librarian', 'Staff'))
  - `PasswordHash` (VARCHAR(255) NULL)
  - `IsActive` (BOOLEAN DEFAULT TRUE)
- **Referential Integrity:** Deactivating staff sets `IsActive = FALSE` without breaking historical audit trails in `BookIssued` and `Receipt`.

### 2.4 `Member` Table
- **Primary Key:** `MemberID` (INT AUTO_INCREMENT)
- **Candidate Key:** `Email` (VARCHAR(150) UNIQUE NOT NULL)
- **Attributes:**
  - `Name` (VARCHAR(150) NOT NULL)
  - `ContactNo` (VARCHAR(20) NOT NULL)
  - `MembershipStatus` (ENUM('Active', 'Suspended', 'Inactive'))
  - `JoinDate` (DATE NOT NULL)
  - `Address` (VARCHAR(255))
- **Business Rule:** Suspended or inactive members are prohibited by stored procedures from checking out books.

### 2.5 `BookIssued` Table (Associative Entity)
- **Primary Key:** `IssueID` (INT AUTO_INCREMENT)
- **Foreign Keys:**
  - `MemberID` REFERENCES `Member(MemberID)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `ISBN` REFERENCES `Books(ISBN)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `IssuedBy` REFERENCES `Staff(StaffID)` ON DELETE RESTRICT ON UPDATE CASCADE
  - `ReturnedBy` REFERENCES `Staff(StaffID)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Attributes:**
  - `IssueDate` (DATE NOT NULL)
  - `DueDate` (DATE NOT NULL, CHECK DueDate >= IssueDate)
  - `ReturnDate` (DATE NULL, CHECK ReturnDate IS NULL OR ReturnDate >= IssueDate)
  - `Status` (ENUM('Issued', 'Returned', 'Lost'))
  - `FineAmount` (DECIMAL(10,2) DEFAULT 0.00)
  - `FinePaidAmount` (DECIMAL(10,2) DEFAULT 0.00)
  - `Notes` (VARCHAR(255))
- **Normalization:** Resolves the Many-to-Many relationship between `Member` and `Books`. Historical records are never deleted upon return; `ReturnDate` and `ReturnedBy` are updated atomically.

### 2.6 `Receipt` Table
- **Primary Key:** `ReceiptID` (INT AUTO_INCREMENT)
- **Candidate Key:** `TransactionID` (VARCHAR(50) UNIQUE NOT NULL)
- **Foreign Keys:**
  - `MemberID` REFERENCES `Member(MemberID)` ON DELETE RESTRICT
  - `StaffID` REFERENCES `Staff(StaffID)` ON DELETE RESTRICT
  - `IssueID` REFERENCES `BookIssued(IssueID)` ON DELETE RESTRICT
- **Attributes:**
  - `TransactionType` (ENUM('Fine Payment', 'Other Fee', 'Refund'))
  - `Amount` (DECIMAL(10,2) CHECK (Amount > 0))
  - `PaymentMethod` (ENUM('Cash', 'UPI', 'Card', 'Other'))
  - `PaymentStatus` (ENUM('Completed', 'Pending', 'Cancelled'))
  - `TransactionDateTime` (DATETIME NOT NULL)
  - `Remarks` (VARCHAR(255))
- **Payment Integrity:** Fine payment receipts are tied atomically to `BookIssued.IssueID` inside transactions. Overpayments are rejected by both triggers and stored procedures.

---

## 3. Database Normalization Stages

1. **1NF (First Normal Form):**
   - All columns contain atomic values (no multi-valued attributes or repeating groups).
   - Each table has an explicitly declared primary key.
2. **2NF (Second Normal Form):**
   - Tables with composite or simple keys have no partial functional dependencies.
   - Every non-key attribute is fully dependent on the primary key.
3. **3NF (Third Normal Form):**
   - No transitive dependencies exist.
   - For example, publisher information is isolated in `Publisher` rather than duplicated in `Books`.
   - Staff and Member demographic details are not repeated in `BookIssued` or `Receipt`.
