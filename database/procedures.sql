-- ============================================================================
-- Library Management System: Stored Procedures
-- Demonstrates Transaction Management, Row Locking (FOR UPDATE), and Business Logic
-- Target RDBMS: MySQL 8.0+
-- ============================================================================

USE `library_management`;

DELIMITER $$

-- ============================================================================
-- 1. Procedure: IssueBook
-- Atomically validates member eligibility, inventory availability, and creates issue record
-- ============================================================================
DROP PROCEDURE IF EXISTS `sp_IssueBook`$$
CREATE PROCEDURE `sp_IssueBook`(
    IN p_MemberID INT,
    IN p_ISBN VARCHAR(20),
    IN p_StaffID INT,
    OUT p_IssueID INT,
    OUT p_DueDate DATE,
    OUT p_StatusMessage VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_MemberStatus VARCHAR(20);
    DECLARE v_ActiveLoans INT DEFAULT 0;
    DECLARE v_MaxLoans INT DEFAULT 3;
    DECLARE v_LoanDurationDays INT DEFAULT 14;
    DECLARE v_AvailableCopies INT DEFAULT 0;
    DECLARE v_TotalCopies INT DEFAULT 0;
    DECLARE v_StaffActive BOOLEAN DEFAULT FALSE;

    -- Default exit handler for unhandled SQL errors to rollback transaction
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_IssueID = NULL;
        SET p_DueDate = NULL;
        SET p_StatusMessage = 'ERROR: Database transaction failed during book issue.';
    END;

    START TRANSACTION;

    -- 1. Validate Staff
    SELECT IsActive INTO v_StaffActive FROM `Staff` WHERE StaffID = p_StaffID;
    IF v_StaffActive IS NULL OR v_StaffActive = FALSE THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Issuing staff member does not exist or is inactive.';
        LEAVE proc_label;
    END IF;

    -- 2. Validate Member
    SELECT MembershipStatus INTO v_MemberStatus FROM `Member` WHERE MemberID = p_MemberID;
    IF v_MemberStatus IS NULL THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Member does not exist.';
        LEAVE proc_label;
    END IF;

    IF v_MemberStatus <> 'Active' THEN
        ROLLBACK;
        SET p_StatusMessage = CONCAT('ERROR: Member status is ', v_MemberStatus, '. Only Active members can borrow books.');
        LEAVE proc_label;
    END IF;

    -- 3. Read configuration settings
    SELECT CAST(SettingValue AS UNSIGNED) INTO v_MaxLoans 
    FROM `Settings` WHERE SettingKey = 'max_books_per_member';
    IF v_MaxLoans IS NULL THEN SET v_MaxLoans = 3; END IF;

    SELECT CAST(SettingValue AS UNSIGNED) INTO v_LoanDurationDays 
    FROM `Settings` WHERE SettingKey = 'loan_duration_days';
    IF v_LoanDurationDays IS NULL THEN SET v_LoanDurationDays = 14; END IF;

    -- 4. Check Member Borrowing Limits
    SELECT COUNT(*) INTO v_ActiveLoans 
    FROM `BookIssued` 
    WHERE MemberID = p_MemberID AND Status = 'Issued';

    IF v_ActiveLoans >= v_MaxLoans THEN
        ROLLBACK;
        SET p_StatusMessage = CONCAT('ERROR: Member has reached maximum borrowing limit of ', v_MaxLoans, ' active books.');
        LEAVE proc_label;
    END IF;

    -- 5. Lock Book row for update to prevent race conditions
    SELECT AvailableCopies, TotalCopies INTO v_AvailableCopies, v_TotalCopies
    FROM `Books` 
    WHERE ISBN = p_ISBN 
    FOR UPDATE;

    IF v_TotalCopies IS NULL THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Book with specified ISBN does not exist.';
        LEAVE proc_label;
    END IF;

    IF v_AvailableCopies <= 0 THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: No copies of this book are currently available.';
        LEAVE proc_label;
    END IF;

    -- 6. Calculate Due Date
    SET p_DueDate = DATE_ADD(CURDATE(), INTERVAL v_LoanDurationDays DAY);

    -- 7. Update Inventory (Decrement Available Copies)
    UPDATE `Books` 
    SET AvailableCopies = AvailableCopies - 1 
    WHERE ISBN = p_ISBN;

    -- 8. Insert Borrowing Record
    INSERT INTO `BookIssued` (
        `MemberID`, 
        `ISBN`, 
        `IssuedBy`, 
        `IssueDate`, 
        `DueDate`, 
        `Status`, 
        `FineAmount`, 
        `FinePaidAmount`
    ) VALUES (
        p_MemberID, 
        p_ISBN, 
        p_StaffID, 
        CURDATE(), 
        p_DueDate, 
        'Issued', 
        0.00, 
        0.00
    );

    SET p_IssueID = LAST_INSERT_ID();
    SET p_StatusMessage = 'SUCCESS';

    COMMIT;
END proc_label$$

-- ============================================================================
-- 2. Procedure: ReturnBook
-- Atomically returns book, assesses fines, restores inventory, and prevents double returns
-- ============================================================================
DROP PROCEDURE IF EXISTS `sp_ReturnBook`$$
CREATE PROCEDURE `sp_ReturnBook`(
    IN p_IssueID INT,
    IN p_StaffID INT,
    OUT p_FineAssessed DECIMAL(10,2),
    OUT p_DaysOverdue INT,
    OUT p_StatusMessage VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_ISBN VARCHAR(20);
    DECLARE v_DueDate DATE;
    DECLARE v_Status VARCHAR(20);
    DECLARE v_StaffActive BOOLEAN DEFAULT FALSE;
    DECLARE v_DailyFine DECIMAL(10,2) DEFAULT 5.00;
    DECLARE v_GracePeriod INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_FineAssessed = 0.00;
        SET p_DaysOverdue = 0;
        SET p_StatusMessage = 'ERROR: Database transaction failed during book return.';
    END;

    START TRANSACTION;

    -- 1. Validate Returning Staff
    SELECT IsActive INTO v_StaffActive FROM `Staff` WHERE StaffID = p_StaffID;
    IF v_StaffActive IS NULL OR v_StaffActive = FALSE THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Returning staff member does not exist or is inactive.';
        LEAVE proc_label;
    END IF;

    -- 2. Lock Issue Record FOR UPDATE
    SELECT ISBN, DueDate, Status INTO v_ISBN, v_DueDate, v_Status
    FROM `BookIssued`
    WHERE IssueID = p_IssueID
    FOR UPDATE;

    IF v_ISBN IS NULL THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Issue transaction does not exist.';
        LEAVE proc_label;
    END IF;

    IF v_Status <> 'Issued' THEN
        ROLLBACK;
        SET p_StatusMessage = CONCAT('ERROR: Cannot return book with status ', v_Status, '. Book has already been processed.');
        LEAVE proc_label;
    END IF;

    -- 3. Read Fine Rate Configuration
    SELECT CAST(SettingValue AS DECIMAL(10,2)) INTO v_DailyFine 
    FROM `Settings` WHERE SettingKey = 'daily_fine_rate';
    IF v_DailyFine IS NULL THEN SET v_DailyFine = 5.00; END IF;

    SELECT CAST(SettingValue AS UNSIGNED) INTO v_GracePeriod 
    FROM `Settings` WHERE SettingKey = 'grace_period_days';
    IF v_GracePeriod IS NULL THEN SET v_GracePeriod = 0; END IF;

    -- 4. Calculate Overdue and Fine
    IF CURDATE() > v_DueDate THEN
        SET p_DaysOverdue = DATEDIFF(CURDATE(), v_DueDate);
        IF p_DaysOverdue > v_GracePeriod THEN
            SET p_FineAssessed = (p_DaysOverdue - v_GracePeriod) * v_DailyFine;
        ELSE
            SET p_FineAssessed = 0.00;
        END IF;
    ELSE
        SET p_DaysOverdue = 0;
        SET p_FineAssessed = 0.00;
    END IF;

    -- 5. Update Issue Record
    UPDATE `BookIssued` 
    SET 
        `ReturnDate` = CURDATE(),
        `ReturnedBy` = p_StaffID,
        `Status` = 'Returned',
        `FineAmount` = p_FineAssessed
    WHERE IssueID = p_IssueID;

    -- 6. Restore Book Inventory
    UPDATE `Books`
    SET AvailableCopies = AvailableCopies + 1
    WHERE ISBN = v_ISBN;

    SET p_StatusMessage = 'SUCCESS';

    COMMIT;
END proc_label$$

-- ============================================================================
-- 3. Procedure: RecordFinePayment
-- Validates payment against remaining balance and atomically creates receipt and updates fine
-- ============================================================================
DROP PROCEDURE IF EXISTS `sp_RecordFinePayment`$$
CREATE PROCEDURE `sp_RecordFinePayment`(
    IN p_IssueID INT,
    IN p_MemberID INT,
    IN p_StaffID INT,
    IN p_Amount DECIMAL(10,2),
    IN p_PaymentMethod VARCHAR(20),
    IN p_TransactionID VARCHAR(50),
    IN p_Remarks VARCHAR(255),
    OUT p_ReceiptID INT,
    OUT p_NewBalance DECIMAL(10,2),
    OUT p_StatusMessage VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_FineAmount DECIMAL(10,2);
    DECLARE v_FinePaidAmount DECIMAL(10,2);
    DECLARE v_CurrentBalance DECIMAL(10,2);
    DECLARE v_IssueMemberID INT;
    DECLARE v_StaffActive BOOLEAN DEFAULT FALSE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_ReceiptID = NULL;
        SET p_NewBalance = NULL;
        SET p_StatusMessage = 'ERROR: Database transaction failed during payment recording.';
    END;

    START TRANSACTION;

    IF p_Amount <= 0 THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Payment amount must be greater than zero.';
        LEAVE proc_label;
    END IF;

    -- 1. Validate Staff
    SELECT IsActive INTO v_StaffActive FROM `Staff` WHERE StaffID = p_StaffID;
    IF v_StaffActive IS NULL OR v_StaffActive = FALSE THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Staff member does not exist or is inactive.';
        LEAVE proc_label;
    END IF;

    -- 2. Lock Issue Record FOR UPDATE
    SELECT FineAmount, FinePaidAmount, MemberID 
    INTO v_FineAmount, v_FinePaidAmount, v_IssueMemberID
    FROM `BookIssued`
    WHERE IssueID = p_IssueID
    FOR UPDATE;

    IF v_FineAmount IS NULL THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Issue transaction does not exist.';
        LEAVE proc_label;
    END IF;

    IF v_IssueMemberID <> p_MemberID THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Member ID does not match the issue transaction.';
        LEAVE proc_label;
    END IF;

    SET v_CurrentBalance = v_FineAmount - v_FinePaidAmount;

    IF v_CurrentBalance <= 0 THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Fine is already fully paid.';
        LEAVE proc_label;
    END IF;

    IF p_Amount > v_CurrentBalance THEN
        ROLLBACK;
        SET p_StatusMessage = CONCAT('ERROR: Payment amount (₹', p_Amount, ') exceeds outstanding balance of ₹', v_CurrentBalance);
        LEAVE proc_label;
    END IF;

    -- 3. Create Receipt
    INSERT INTO `Receipt` (
        `TransactionID`,
        `MemberID`,
        `StaffID`,
        `IssueID`,
        `TransactionType`,
        `Amount`,
        `PaymentMethod`,
        `PaymentStatus`,
        `TransactionDateTime`,
        `Remarks`
    ) VALUES (
        p_TransactionID,
        p_MemberID,
        p_StaffID,
        p_IssueID,
        'Fine Payment',
        p_Amount,
        p_PaymentMethod,
        'Completed',
        NOW(),
        p_Remarks
    );

    SET p_ReceiptID = LAST_INSERT_ID();

    -- 4. Update Fine Paid Amount
    UPDATE `BookIssued`
    SET FinePaidAmount = FinePaidAmount + p_Amount
    WHERE IssueID = p_IssueID;

    SET p_NewBalance = v_CurrentBalance - p_Amount;
    SET p_StatusMessage = 'SUCCESS';

    COMMIT;
END proc_label$$

-- ============================================================================
-- 4. Procedure: GetMemberBorrowingHistory
-- ============================================================================
DROP PROCEDURE IF EXISTS `sp_GetMemberBorrowingHistory`$$
CREATE PROCEDURE `sp_GetMemberBorrowingHistory`(
    IN p_MemberID INT
)
BEGIN
    SELECT 
        bi.IssueID,
        bi.ISBN,
        b.Title,
        b.AuthorName,
        p.PublisherName,
        bi.IssueDate,
        bi.DueDate,
        bi.ReturnDate,
        bi.Status,
        bi.FineAmount,
        bi.FinePaidAmount,
        (bi.FineAmount - bi.FinePaidAmount) AS OutstandingFine,
        s1.Name AS IssuedByStaff,
        s2.Name AS ReturnedByStaff
    FROM `BookIssued` bi
    INNER JOIN `Books` b ON bi.ISBN = b.ISBN
    INNER JOIN `Publisher` p ON b.PublisherID = p.PublisherID
    INNER JOIN `Staff` s1 ON bi.IssuedBy = s1.StaffID
    LEFT JOIN `Staff` s2 ON bi.ReturnedBy = s2.StaffID
    WHERE bi.MemberID = p_MemberID
    ORDER BY bi.IssueDate DESC, bi.IssueID DESC;
END$$

-- ============================================================================
-- 5. Procedure: GetOverdueBooks
-- ============================================================================
DROP PROCEDURE IF EXISTS `sp_GetOverdueBooks`$$
CREATE PROCEDURE `sp_GetOverdueBooks`()
BEGIN
    SELECT 
        bi.IssueID,
        bi.MemberID,
        m.Name AS MemberName,
        m.Email AS MemberEmail,
        m.ContactNo AS MemberContact,
        bi.ISBN,
        b.Title AS BookTitle,
        b.AuthorName AS BookAuthor,
        bi.IssueDate,
        bi.DueDate,
        DATEDIFF(CURDATE(), bi.DueDate) AS DaysOverdue,
        CAST(GREATEST(0, DATEDIFF(CURDATE(), bi.DueDate) * 5.00) AS DECIMAL(10,2)) AS EstimatedFine,
        bi.FineAmount AS RecordedFine,
        bi.FinePaidAmount,
        s.Name AS IssuedByStaff
    FROM `BookIssued` bi
    INNER JOIN `Member` m ON bi.MemberID = m.MemberID
    INNER JOIN `Books` b ON bi.ISBN = b.ISBN
    INNER JOIN `Staff` s ON bi.IssuedBy = s.StaffID
    WHERE bi.Status = 'Issued' AND CURDATE() > bi.DueDate
    ORDER BY DaysOverdue DESC;
END$$

-- ============================================================================
-- 6. Procedure: AddBook
-- Atomically creates a new book, resolves or registers publisher, and sets initial stock
-- ============================================================================
DROP PROCEDURE IF EXISTS `sp_AddBook`$$
CREATE PROCEDURE `sp_AddBook`(
    IN p_ISBN VARCHAR(20),
    IN p_Title VARCHAR(200),
    IN p_AuthorName VARCHAR(150),
    IN p_PublisherName VARCHAR(150),
    IN p_Price DECIMAL(10,2),
    IN p_NoOfPages INT,
    IN p_Edition VARCHAR(50),
    IN p_TotalCopies INT,
    OUT p_StatusMessage VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_PublisherID INT DEFAULT NULL;

    -- Exit handler for unhandled SQL errors to rollback transaction
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Database transaction failed during book creation.';
    END;

    START TRANSACTION;

    -- 1. Input Validation
    IF p_ISBN IS NULL OR TRIM(p_ISBN) = '' THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: ISBN cannot be blank.';
        LEAVE proc_label;
    END IF;

    IF p_Title IS NULL OR TRIM(p_Title) = '' THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Title cannot be blank.';
        LEAVE proc_label;
    END IF;

    IF p_AuthorName IS NULL OR TRIM(p_AuthorName) = '' THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Author name cannot be blank.';
        LEAVE proc_label;
    END IF;

    IF p_PublisherName IS NULL OR TRIM(p_PublisherName) = '' THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Publisher name cannot be blank.';
        LEAVE proc_label;
    END IF;

    IF p_Price < 0 THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Price cannot be negative.';
        LEAVE proc_label;
    END IF;

    IF p_TotalCopies < 0 THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Total copies cannot be negative.';
        LEAVE proc_label;
    END IF;

    IF p_NoOfPages IS NOT NULL AND p_NoOfPages <= 0 THEN
        ROLLBACK;
        SET p_StatusMessage = 'ERROR: Number of pages must be greater than zero.';
        LEAVE proc_label;
    END IF;

    -- 2. Duplicate ISBN check
    IF EXISTS (SELECT 1 FROM `Books` WHERE `ISBN` = TRIM(p_ISBN)) THEN
        ROLLBACK;
        SET p_StatusMessage = CONCAT('ERROR: Book with ISBN ', TRIM(p_ISBN), ' already exists.');
        LEAVE proc_label;
    END IF;

    -- 3. Resolve or register Publisher
    SELECT `PublisherID` INTO v_PublisherID 
    FROM `Publisher` 
    WHERE `PublisherName` = TRIM(p_PublisherName) 
    LIMIT 1;

    IF v_PublisherID IS NULL THEN
        INSERT INTO `Publisher` (`PublisherName`) VALUES (TRIM(p_PublisherName));
        SET v_PublisherID = LAST_INSERT_ID();
    END IF;

    -- 4. Insert Book (Initially AvailableCopies = TotalCopies)
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
        TRIM(p_ISBN),
        TRIM(p_Title),
        TRIM(p_AuthorName),
        v_PublisherID,
        p_Price,
        p_NoOfPages,
        NULLIF(TRIM(p_Edition), ''),
        p_TotalCopies,
        p_TotalCopies
    );

    COMMIT;
    SET p_StatusMessage = CONCAT('SUCCESS: Book "', TRIM(p_Title), '" registered successfully with ', p_TotalCopies, ' available copies.');
END$$

DELIMITER ;
