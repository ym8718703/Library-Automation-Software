-- ============================================================================
-- Library Management System: Indexes for Query Optimization & Referential Search
-- Target RDBMS: MySQL 8.0+
-- ============================================================================

USE `library_management`;

-- Books Table: Search indexes for ISBN, Title, Author, Publisher
CREATE INDEX `idx_books_title` ON `Books` (`Title`);
CREATE INDEX `idx_books_author` ON `Books` (`AuthorName`);
CREATE INDEX `idx_books_publisher` ON `Books` (`PublisherID`);
CREATE INDEX `idx_books_availability` ON `Books` (`AvailableCopies`);

-- Member Table: Quick search indexes by Name, Email, Status, Contact
CREATE INDEX `idx_member_name` ON `Member` (`Name`);
CREATE INDEX `idx_member_status` ON `Member` (`MembershipStatus`);
CREATE INDEX `idx_member_contact` ON `Member` (`ContactNo`);

-- Staff Table: Search by Name, Post, Active status
CREATE INDEX `idx_staff_name` ON `Staff` (`Name`);
CREATE INDEX `idx_staff_active` ON `Staff` (`IsActive`);
CREATE INDEX `idx_staff_post` ON `Staff` (`Post`);

-- BookIssued Table: Critical search & filter indexes for Active Issues, Overdue, Member History
CREATE INDEX `idx_bookissued_member` ON `BookIssued` (`MemberID`);
CREATE INDEX `idx_bookissued_isbn` ON `BookIssued` (`ISBN`);
CREATE INDEX `idx_bookissued_status` ON `BookIssued` (`Status`);
CREATE INDEX `idx_bookissued_duedate` ON `BookIssued` (`DueDate`);
CREATE INDEX `idx_bookissued_status_duedate` ON `BookIssued` (`Status`, `DueDate`);
CREATE INDEX `idx_bookissued_fines` ON `BookIssued` (`FineAmount`, `FinePaidAmount`);

-- Receipt Table: Search and filter by Date, Member, Staff, Type, Status
CREATE INDEX `idx_receipt_member` ON `Receipt` (`MemberID`);
CREATE INDEX `idx_receipt_staff` ON `Receipt` (`StaffID`);
CREATE INDEX `idx_receipt_issue` ON `Receipt` (`IssueID`);
CREATE INDEX `idx_receipt_datetime` ON `Receipt` (`TransactionDateTime`);
CREATE INDEX `idx_receipt_type_status` ON `Receipt` (`TransactionType`, `PaymentStatus`);
