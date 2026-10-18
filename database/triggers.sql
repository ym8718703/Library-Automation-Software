-- ============================================================================
-- Library Management System: Database Triggers
-- Demonstrates declarative integrity checks and audit trails without duplicate inventory manipulation
-- Target RDBMS: MySQL 8.0+
-- ============================================================================

USE `library_management`;

DELIMITER $$

-- ============================================================================
-- 1. Trigger: Audit Book Changes (Updates and Stock Adjustments)
-- Records changes to TotalCopies, AvailableCopies, or Price into BookAuditLog
-- ============================================================================
DROP TRIGGER IF EXISTS `trg_Books_AfterUpdate`$$
CREATE TRIGGER `trg_Books_AfterUpdate`
AFTER UPDATE ON `Books`
FOR EACH ROW
BEGIN
    IF (OLD.TotalCopies <> NEW.TotalCopies) OR 
       (OLD.AvailableCopies <> NEW.AvailableCopies) OR 
       (OLD.Price <> NEW.Price) THEN
       
        INSERT INTO `BookAuditLog` (
            `ISBN`,
            `ActionType`,
            `OldTotalCopies`,
            `NewTotalCopies`,
            `OldAvailableCopies`,
            `NewAvailableCopies`,
            `OldPrice`,
            `NewPrice`,
            `ChangedAt`,
            `ChangedBy`
        ) VALUES (
            NEW.ISBN,
            'UPDATE',
            OLD.TotalCopies,
            NEW.TotalCopies,
            OLD.AvailableCopies,
            NEW.AvailableCopies,
            OLD.Price,
            NEW.Price,
            NOW(),
            CURRENT_USER()
        );
    END IF;
END$$

-- ============================================================================
-- 2. Trigger: Audit New Book Additions
-- ============================================================================
DROP TRIGGER IF EXISTS `trg_Books_AfterInsert`$$
CREATE TRIGGER `trg_Books_AfterInsert`
AFTER INSERT ON `Books`
FOR EACH ROW
BEGIN
    INSERT INTO `BookAuditLog` (
        `ISBN`,
        `ActionType`,
        `OldTotalCopies`,
        `NewTotalCopies`,
        `OldAvailableCopies`,
        `NewAvailableCopies`,
        `OldPrice`,
        `NewPrice`,
        `ChangedAt`,
        `ChangedBy`
    ) VALUES (
        NEW.ISBN,
        'INSERT',
        NULL,
        NEW.TotalCopies,
        NULL,
        NEW.AvailableCopies,
        NULL,
        NEW.Price,
        NOW(),
        CURRENT_USER()
    );
END$$

-- ============================================================================
-- 3. Trigger: Validate Fine Payment Before Receipt Insertion
-- Ensures that if a fine payment is made directly for an IssueID, the payment
-- does not exceed the remaining unpaid fine amount on that issue.
-- ============================================================================
DROP TRIGGER IF EXISTS `trg_Receipt_BeforeInsert`$$
CREATE TRIGGER `trg_Receipt_BeforeInsert`
BEFORE INSERT ON `Receipt`
FOR EACH ROW
BEGIN
    DECLARE v_FineAmount DECIMAL(10,2);
    DECLARE v_FinePaidAmount DECIMAL(10,2);
    DECLARE v_RemainingBalance DECIMAL(10,2);

    IF NEW.TransactionType = 'Fine Payment' AND NEW.IssueID IS NOT NULL THEN
        SELECT FineAmount, FinePaidAmount 
        INTO v_FineAmount, v_FinePaidAmount
        FROM `BookIssued`
        WHERE IssueID = NEW.IssueID;

        IF v_FineAmount IS NOT NULL THEN
            SET v_RemainingBalance = v_FineAmount - v_FinePaidAmount;
            IF NEW.Amount > v_RemainingBalance THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Integrity Error: Payment amount exceeds the outstanding fine balance on this issue.';
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;
