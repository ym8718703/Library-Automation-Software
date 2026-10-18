-- ============================================================================
-- Library Management System: Sample SQL Demonstrations
-- Demonstrating DBMS Concepts: Joins, Aggregations, GROUP BY / HAVING, Subqueries
-- Target RDBMS: MySQL 8.0+
-- ============================================================================

USE `library_management`;

-- ============================================================================
-- 1. SQL JOINS
-- ============================================================================

-- Query 1: Display books with publisher names (INNER JOIN)
SELECT 
    b.ISBN,
    b.Title,
    b.AuthorName,
    p.PublisherName,
    b.Price,
    b.AvailableCopies,
    b.TotalCopies
FROM Books b
INNER JOIN Publisher p ON b.PublisherID = p.PublisherID
ORDER BY b.Title ASC;

-- Query 2: Display all currently issued books with borrower and issuing staff (Multi-table JOIN)
SELECT 
    bi.IssueID,
    b.Title AS BookTitle,
    m.Name AS BorrowerName,
    m.Email AS BorrowerEmail,
    s.Name AS IssuedByStaff,
    bi.IssueDate,
    bi.DueDate
FROM BookIssued bi
INNER JOIN Books b ON bi.ISBN = b.ISBN
INNER JOIN Member m ON bi.MemberID = m.MemberID
INNER JOIN Staff s ON bi.IssuedBy = s.StaffID
WHERE bi.Status = 'Issued'
ORDER BY bi.DueDate ASC;

-- Query 3: Display overdue books with calculated overdue duration and penalty (Filtered JOIN)
SELECT 
    bi.IssueID,
    b.Title AS BookTitle,
    m.Name AS MemberName,
    m.ContactNo,
    bi.IssueDate,
    bi.DueDate,
    DATEDIFF(CURDATE(), bi.DueDate) AS DaysOverdue,
    (DATEDIFF(CURDATE(), bi.DueDate) * 5.00) AS CalculatedFineINR
FROM BookIssued bi
INNER JOIN Books b ON bi.ISBN = b.ISBN
INNER JOIN Member m ON bi.MemberID = m.MemberID
WHERE bi.Status = 'Issued' AND CURDATE() > bi.DueDate
ORDER BY DaysOverdue DESC;

-- Query 4: Display complete borrowing history for a specific member (JOIN with conditions)
SELECT 
    bi.IssueID,
    b.Title,
    b.AuthorName,
    bi.IssueDate,
    bi.DueDate,
    bi.ReturnDate,
    bi.Status,
    bi.FineAmount,
    bi.FinePaidAmount
FROM BookIssued bi
INNER JOIN Books b ON bi.ISBN = b.ISBN
WHERE bi.MemberID = 1
ORDER BY bi.IssueDate DESC;

-- Query 5: Display receipts with member and staff details (Multi-table JOIN)
SELECT 
    r.ReceiptID,
    r.TransactionID,
    m.Name AS MemberName,
    s.Name AS ProcessedByStaff,
    r.TransactionType,
    r.Amount,
    r.PaymentMethod,
    r.PaymentStatus,
    r.TransactionDateTime
FROM Receipt r
INNER JOIN Member m ON r.MemberID = m.MemberID
INNER JOIN Staff s ON r.StaffID = s.StaffID
ORDER BY r.TransactionDateTime DESC;

-- Query 6: Display fines and outstanding balances across transactions
SELECT 
    bi.IssueID,
    m.Name AS MemberName,
    m.Email,
    b.Title,
    bi.FineAmount,
    bi.FinePaidAmount,
    (bi.FineAmount - bi.FinePaidAmount) AS OutstandingBalance
FROM BookIssued bi
INNER JOIN Member m ON bi.MemberID = m.MemberID
INNER JOIN Books b ON bi.ISBN = b.ISBN
WHERE bi.FineAmount > bi.FinePaidAmount
ORDER BY OutstandingBalance DESC;

-- Query 7: Display publisher-wise inventory totals
SELECT 
    p.PublisherID,
    p.PublisherName,
    COUNT(b.ISBN) AS TotalTitles,
    COALESCE(SUM(b.TotalCopies), 0) AS TotalStock,
    COALESCE(SUM(b.AvailableCopies), 0) AS AvailableStock,
    COALESCE(SUM(b.TotalCopies - b.AvailableCopies), 0) AS BorrowedStock
FROM Publisher p
LEFT JOIN Books b ON p.PublisherID = b.PublisherID
GROUP BY p.PublisherID, p.PublisherName
ORDER BY TotalTitles DESC;

-- Query 8: Display staff activity summary without join multiplication
SELECT 
    s.StaffID,
    s.Name AS StaffName,
    s.Post,
    COALESCE(i.IssuedCount, 0) AS BooksIssued,
    COALESCE(r.ReturnedCount, 0) AS BooksReturned,
    COALESCE(rc.ReceiptCount, 0) AS ReceiptsProcessed,
    COALESCE(rc.TotalCollected, 0.00) AS TotalMoneyCollected
FROM Staff s
LEFT JOIN (SELECT IssuedBy, COUNT(*) AS IssuedCount FROM BookIssued GROUP BY IssuedBy) i ON s.StaffID = i.IssuedBy
LEFT JOIN (SELECT ReturnedBy, COUNT(*) AS ReturnedCount FROM BookIssued WHERE ReturnedBy IS NOT NULL GROUP BY ReturnedBy) r ON s.StaffID = r.ReturnedBy
LEFT JOIN (SELECT StaffID, COUNT(*) AS ReceiptCount, SUM(Amount) AS TotalCollected FROM Receipt WHERE PaymentStatus = 'Completed' GROUP BY StaffID) rc ON s.StaffID = rc.StaffID
ORDER BY s.StaffID;

-- ============================================================================
-- 2. AGGREGATE FUNCTIONS & GROUP BY / HAVING
-- ============================================================================

-- Query 9: Key library catalog inventory aggregates
SELECT 
    COUNT(*) AS UniqueTitles,
    SUM(TotalCopies) AS TotalPhysicalCopies,
    SUM(AvailableCopies) AS AvailablePhysicalCopies,
    SUM(TotalCopies - AvailableCopies) AS CurrentlyIssuedCopies,
    MIN(Price) AS LowestPrice,
    MAX(Price) AS HighestPrice,
    ROUND(AVG(Price), 2) AS AverageBookPrice
FROM Books;

-- Query 10: Count books by publisher having more than 3 titles (HAVING clause)
SELECT 
    p.PublisherName,
    COUNT(b.ISBN) AS TitleCount,
    SUM(b.TotalCopies) AS TotalCopies
FROM Publisher p
INNER JOIN Books b ON p.PublisherID = b.PublisherID
GROUP BY p.PublisherID, p.PublisherName
HAVING COUNT(b.ISBN) >= 3
ORDER BY TitleCount DESC;

-- Query 11: Identify members who have borrowed more than 1 book in total
SELECT 
    m.MemberID,
    m.Name AS MemberName,
    m.Email,
    COUNT(bi.IssueID) AS TotalBorrowings
FROM Member m
INNER JOIN BookIssued bi ON m.MemberID = bi.MemberID
GROUP BY m.MemberID, m.Name, m.Email
HAVING COUNT(bi.IssueID) > 1
ORDER BY TotalBorrowings DESC;

-- Query 12: Monthly fine collections summary
SELECT 
    DATE_FORMAT(TransactionDateTime, '%Y-%m') AS YearMonth,
    COUNT(*) AS TotalTransactions,
    SUM(Amount) AS TotalCollectedINR
FROM Receipt
WHERE TransactionType = 'Fine Payment' AND PaymentStatus = 'Completed'
GROUP BY DATE_FORMAT(TransactionDateTime, '%Y-%m')
ORDER BY YearMonth DESC;

-- ============================================================================
-- 3. SUBQUERIES
-- ============================================================================

-- Query 13: Find books that have NEVER been borrowed (Subquery with NOT IN)
SELECT 
    b.ISBN,
    b.Title,
    b.AuthorName,
    p.PublisherName,
    b.TotalCopies
FROM Books b
INNER JOIN Publisher p ON b.PublisherID = p.PublisherID
WHERE b.ISBN NOT IN (SELECT DISTINCT ISBN FROM BookIssued)
ORDER BY b.Title ASC;

-- Query 14: Find members who have NEVER borrowed any book (Subquery with NOT EXISTS)
SELECT 
    m.MemberID,
    m.Name,
    m.Email,
    m.MembershipStatus,
    m.JoinDate
FROM Member m
WHERE NOT EXISTS (
    SELECT 1 FROM BookIssued bi WHERE bi.MemberID = m.MemberID
)
ORDER BY m.MemberID ASC;

-- Query 15: Find books borrowed more frequently than the average borrowing frequency
SELECT 
    b.ISBN,
    b.Title,
    b.AuthorName,
    borrow_counts.BorrowCount
FROM Books b
INNER JOIN (
    SELECT ISBN, COUNT(*) AS BorrowCount
    FROM BookIssued
    GROUP BY ISBN
) borrow_counts ON b.ISBN = borrow_counts.ISBN
WHERE borrow_counts.BorrowCount > (
    SELECT AVG(item_count) 
    FROM (
        SELECT COUNT(*) AS item_count 
        FROM BookIssued 
        GROUP BY ISBN
    ) sub
)
ORDER BY borrow_counts.BorrowCount DESC;

-- Query 16: Find the most expensive book(s) in the catalog (Subquery with Scalar MAX)
SELECT 
    b.ISBN,
    b.Title,
    b.AuthorName,
    p.PublisherName,
    b.Price
FROM Books b
INNER JOIN Publisher p ON b.PublisherID = p.PublisherID
WHERE b.Price = (SELECT MAX(Price) FROM Books);

-- Query 17: Members with multiple active overdue books
SELECT 
    m.MemberID,
    m.Name,
    m.Email,
    COUNT(*) AS OverdueBookCount
FROM BookIssued bi
INNER JOIN Member m ON bi.MemberID = m.MemberID
WHERE bi.Status = 'Issued' AND CURDATE() > bi.DueDate
GROUP BY m.MemberID, m.Name, m.Email
HAVING COUNT(*) >= 1;
