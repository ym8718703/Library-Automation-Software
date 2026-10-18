# Library Management System - Database Documentation

This directory contains the complete SQL definitions, initialization scripts, seed data, stored procedures, triggers, views, and indexes for the Library Management System.

## File Manifest

| File | Purpose |
|------|---------|
| `schema.sql` | DDL script for database creation, 6 core relational tables, audit log, constraints, and settings table. |
| `indexes.sql` | Secondary indexes for query optimization, search filters, and foreign key traversal. |
| `views.sql` | 7 business views (`vw_BookPublisherDetails`, `vw_CurrentIssuedBooks`, `vw_OverdueBooks`, `vw_MemberBorrowingHistory`, `vw_FineOutstanding`, `vw_ReceiptDetails`, `vw_StaffActivity`). |
| `procedures.sql` | Stored procedures with ACID transaction blocks and row locking (`sp_IssueBook`, `sp_ReturnBook`, `sp_RecordFinePayment`, `sp_GetMemberBorrowingHistory`, `sp_GetOverdueBooks`). |
| `triggers.sql` | Triggers for data audit logging (`trg_Books_AfterUpdate`, `trg_Books_AfterInsert`) and payment integrity (`trg_Receipt_BeforeInsert`). |
| `seed.sql` | Comprehensive sample dataset with 6 publishers, 24 books, 6 staff, 18 members, 24 borrowing transactions, 14 receipts, and settings. |
| `sample-queries.sql` | 17 pre-crafted DBMS demonstration queries showing joins, aggregate functions, GROUP BY / HAVING, and subqueries. |
| `er-mapping.md` | Relational mapping, schema analysis, and normalization details. |

## Quick Initialization

To initialize or reset the database via MySQL CLI:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/indexes.sql
mysql -u root -p < database/views.sql
mysql -u root -p < database/procedures.sql
mysql -u root -p < database/triggers.sql
mysql -u root -p < database/seed.sql
```
