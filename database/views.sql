-- ============================================================================
-- Library Management System: SQL Views
-- Target RDBMS: MySQL 8.0+
-- ============================================================================

USE `library_management`;

-- Drop views if they already exist
DROP VIEW IF EXISTS `vw_StaffActivity`;
DROP VIEW IF EXISTS `vw_ReceiptDetails`;
DROP VIEW IF EXISTS `vw_FineOutstanding`;
DROP VIEW IF EXISTS `vw_MemberBorrowingHistory`;
DROP VIEW IF EXISTS `vw_OverdueBooks`;
DROP VIEW IF EXISTS `vw_CurrentIssuedBooks`;
DROP VIEW IF EXISTS `vw_BookPublisherDetails`;

-- ============================================================================
-- 1. View: Book and Publisher Details
-- ============================================================================
CREATE VIEW `vw_BookPublisherDetails` AS
SELECT 
    b.ISBN,
    b.Title,
    b.AuthorName,
    b.PublisherID,
    p.PublisherName,
    b.Price,
    b.NoOfPages,
    b.Edition,
    b.TotalCopies,
    b.AvailableCopies,
    (b.TotalCopies - b.AvailableCopies) AS BorrowedCopies,
    CASE 
        WHEN b.AvailableCopies > 0 THEN 'In Stock'
        ELSE 'Out of Stock'
    END AS AvailabilityStatus,
    b.CreatedAt,
    b.UpdatedAt
FROM `Books` b
INNER JOIN `Publisher` p ON b.PublisherID = p.PublisherID;

-- ============================================================================
-- 2. View: Current Issued Books
-- ============================================================================
CREATE VIEW `vw_CurrentIssuedBooks` AS
SELECT 
    bi.IssueID,
    bi.MemberID,
    m.Name AS MemberName,
    m.Email AS MemberEmail,
    m.ContactNo AS MemberContact,
    bi.ISBN,
    b.Title AS BookTitle,
    b.AuthorName AS BookAuthor,
    bi.IssuedBy,
    s.Name AS IssuedByStaffName,
    bi.IssueDate,
    bi.DueDate,
    bi.Status,
    DATEDIFF(CURDATE(), bi.DueDate) AS DaysOverdue,
    CASE 
        WHEN CURDATE() > bi.DueDate THEN 'Overdue'
        ELSE 'Normal'
    END AS LoanStatus
FROM `BookIssued` bi
INNER JOIN `Member` m ON bi.MemberID = m.MemberID
INNER JOIN `Books` b ON bi.ISBN = b.ISBN
INNER JOIN `Staff` s ON bi.IssuedBy = s.StaffID
WHERE bi.Status = 'Issued';

-- ============================================================================
-- 3. View: Overdue Books with Real-time Fine Calculation
-- ============================================================================
CREATE VIEW `vw_OverdueBooks` AS
SELECT 
    bi.IssueID,
    bi.MemberID,
    m.Name AS MemberName,
    m.Email AS MemberEmail,
    m.ContactNo AS MemberContact,
    bi.ISBN,
    b.Title AS BookTitle,
    bi.IssueDate,
    bi.DueDate,
    DATEDIFF(CURDATE(), bi.DueDate) AS DaysOverdue,
    -- Default daily fine rate ₹5/day
    CAST(GREATEST(0, DATEDIFF(CURDATE(), bi.DueDate) * 5.00) AS DECIMAL(10,2)) AS EstimatedFine,
    bi.FineAmount AS AssessedFine,
    bi.FinePaidAmount,
    (bi.FineAmount - bi.FinePaidAmount) AS OutstandingAssessedFine
FROM `BookIssued` bi
INNER JOIN `Member` m ON bi.MemberID = m.MemberID
INNER JOIN `Books` b ON bi.ISBN = b.ISBN
WHERE bi.Status = 'Issued' AND CURDATE() > bi.DueDate;

-- ============================================================================
-- 4. View: Complete Member Borrowing History
-- ============================================================================
CREATE VIEW `vw_MemberBorrowingHistory` AS
SELECT 
    bi.IssueID,
    bi.MemberID,
    m.Name AS MemberName,
    m.MembershipStatus,
    bi.ISBN,
    b.Title AS BookTitle,
    b.AuthorName AS BookAuthor,
    p.PublisherName,
    bi.IssueDate,
    bi.DueDate,
    bi.ReturnDate,
    bi.Status,
    bi.FineAmount,
    bi.FinePaidAmount,
    (bi.FineAmount - bi.FinePaidAmount) AS RemainingFine,
    s1.Name AS IssuedByStaff,
    s2.Name AS ReturnedByStaff
FROM `BookIssued` bi
INNER JOIN `Member` m ON bi.MemberID = m.MemberID
INNER JOIN `Books` b ON bi.ISBN = b.ISBN
INNER JOIN `Publisher` p ON b.PublisherID = p.PublisherID
INNER JOIN `Staff` s1 ON bi.IssuedBy = s1.StaffID
LEFT JOIN `Staff` s2 ON bi.ReturnedBy = s2.StaffID;

-- ============================================================================
-- 5. View: Outstanding Fines
-- ============================================================================
CREATE VIEW `vw_FineOutstanding` AS
SELECT 
    bi.IssueID,
    bi.MemberID,
    m.Name AS MemberName,
    m.Email AS MemberEmail,
    m.ContactNo AS MemberContact,
    bi.ISBN,
    b.Title AS BookTitle,
    bi.IssueDate,
    bi.DueDate,
    bi.ReturnDate,
    bi.Status,
    bi.FineAmount,
    bi.FinePaidAmount,
    (bi.FineAmount - bi.FinePaidAmount) AS OutstandingBalance
FROM `BookIssued` bi
INNER JOIN `Member` m ON bi.MemberID = m.MemberID
INNER JOIN `Books` b ON bi.ISBN = b.ISBN
WHERE (bi.FineAmount - bi.FinePaidAmount) > 0;

-- ============================================================================
-- 6. View: Receipt Details with Associated Entity Info
-- ============================================================================
CREATE VIEW `vw_ReceiptDetails` AS
SELECT 
    r.ReceiptID,
    r.TransactionID,
    r.MemberID,
    m.Name AS MemberName,
    m.Email AS MemberEmail,
    r.StaffID,
    s.Name AS StaffName,
    r.IssueID,
    b.Title AS BookTitle,
    b.ISBN,
    r.TransactionType,
    r.Amount,
    r.PaymentMethod,
    r.PaymentStatus,
    r.TransactionDateTime,
    r.Remarks
FROM `Receipt` r
INNER JOIN `Member` m ON r.MemberID = m.MemberID
INNER JOIN `Staff` s ON r.StaffID = s.StaffID
LEFT JOIN `BookIssued` bi ON r.IssueID = bi.IssueID
LEFT JOIN `Books` b ON bi.ISBN = b.ISBN;

-- ============================================================================
-- 7. View: Staff Activity Metrics (Avoids Join Multiplication via Subqueries)
-- ============================================================================
CREATE VIEW `vw_StaffActivity` AS
SELECT 
    s.StaffID,
    s.Name AS StaffName,
    s.Post,
    s.Email,
    s.IsActive,
    COALESCE(issue_counts.TotalIssued, 0) AS TotalBooksIssued,
    COALESCE(return_counts.TotalReturned, 0) AS TotalBooksReturned,
    COALESCE(receipt_counts.TotalReceipts, 0) AS TotalReceiptsProcessed,
    COALESCE(receipt_counts.TotalAmountCollected, 0.00) AS TotalAmountCollected
FROM `Staff` s
LEFT JOIN (
    SELECT IssuedBy, COUNT(*) AS TotalIssued 
    FROM `BookIssued` 
    GROUP BY IssuedBy
) issue_counts ON s.StaffID = issue_counts.IssuedBy
LEFT JOIN (
    SELECT ReturnedBy, COUNT(*) AS TotalReturned 
    FROM `BookIssued` 
    WHERE ReturnedBy IS NOT NULL 
    GROUP BY ReturnedBy
) return_counts ON s.StaffID = return_counts.ReturnedBy
LEFT JOIN (
    SELECT StaffID, COUNT(*) AS TotalReceipts, SUM(Amount) AS TotalAmountCollected 
    FROM `Receipt` 
    WHERE PaymentStatus = 'Completed' 
    GROUP BY StaffID
) receipt_counts ON s.StaffID = receipt_counts.StaffID;
