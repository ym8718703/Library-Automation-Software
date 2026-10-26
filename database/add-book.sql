-- ============================================================================
-- Library Management System: Add Book Template & Verification Script
-- Target: MySQL Workbench / MySQL 8.0+
-- Database: library_management
-- ============================================================================

USE `library_management`;

-- ============================================================================
-- METHOD 1: Recommended — Using Stored Procedure (Handles Publisher & Audit)
-- ============================================================================
-- sp_AddBook automatically:
--  1. Checks if the Publisher exists; if not, creates the Publisher record.
--  2. Sets AvailableCopies = TotalCopies.
--  3. Fires trigger 'trg_Books_AfterInsert' which logs the entry to BookAuditLog.
--  4. Returns a status message.

CALL sp_AddBook(
    '978-0134494166',                           -- ISBN (VARCHAR 20)
    'Clean Architecture',                       -- Title (VARCHAR 200)
    'Robert C. Martin',                         -- AuthorName (VARCHAR 150)
    'Pearson Education',                        -- PublisherName (VARCHAR 150)
    950.00,                                     -- Price (DECIMAL 10,2)
    432,                                        -- NoOfPages (INT)
    '1st Edition',                              -- Edition (VARCHAR 50)
    5,                                          -- TotalCopies (INT)
    @status_message                             -- Output message
);

-- Check status message:
SELECT @status_message AS `Operation Status`;


-- ============================================================================
-- METHOD 2: Direct SQL INSERT
-- ============================================================================
-- If you prefer standard SQL INSERT statements, run the following:

-- Step 1 (Optional): If the publisher is new, insert it first:
INSERT IGNORE INTO `Publisher` (`PublisherName`) 
VALUES ('Pragmatic Bookshelf');

-- Step 2: Insert into Books (AvailableCopies must be <= TotalCopies):
INSERT INTO `Books` (
    `ISBN`, 
    `Title`, 
    `AuthorName`, 
    `PublisherID`, 
    `Price`, 
    `NoOfPages`, 
    `Edition`, 
    `TotalCopies`, 
    `AvailableCopies`
) VALUES (
    '978-1680502398',
    'The Pragmatic Programmer: 20th Anniversary Edition',
    'David Thomas, Andrew Hunt',
    (SELECT `PublisherID` FROM `Publisher` WHERE `PublisherName` = 'Pragmatic Bookshelf' LIMIT 1),
    1200.00,
    352,
    '20th Anniversary',
    6,
    6
);


-- ============================================================================
-- VERIFICATION QUERIES (Run these in MySQL Workbench to see your data reflect)
-- ============================================================================

-- 1. View all books (latest first)
SELECT 
    `ISBN`, 
    `Title`, 
    `AuthorName`, 
    `Price`, 
    `AvailableCopies`, 
    `TotalCopies`, 
    `CreatedAt`
FROM `Books` 
ORDER BY `CreatedAt` DESC 
LIMIT 10;

-- 2. View through the Business View (with Publisher Name and Stock status)
SELECT * 
FROM `vw_BookPublisherDetails` 
ORDER BY `CreatedAt` DESC 
LIMIT 10;

-- 3. Verify the Trigger fired and logged into the Audit Log table
SELECT * 
FROM `BookAuditLog` 
ORDER BY `ChangedAt` DESC 
LIMIT 10;
