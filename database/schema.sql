-- ============================================================================
-- Library Management System: Database Schema
-- Storage Engine: InnoDB (Full ACID, Foreign Key Constraints, Transactions)
-- Target RDBMS: MySQL 8.0+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `library_management` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `library_management`;

-- Drop existing tables in reverse dependency order if re-initializing
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `Receipt`;
DROP TABLE IF EXISTS `BookIssued`;
DROP TABLE IF EXISTS `Member`;
DROP TABLE IF EXISTS `Staff`;
DROP TABLE IF EXISTS `Books`;
DROP TABLE IF EXISTS `Publisher`;
DROP TABLE IF EXISTS `BookAuditLog`;
DROP TABLE IF EXISTS `Settings`;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. Publisher Table
-- ============================================================================
CREATE TABLE `Publisher` (
    `PublisherID` INT NOT NULL AUTO_INCREMENT,
    `PublisherName` VARCHAR(150) NOT NULL,
    `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `pk_publisher` PRIMARY KEY (`PublisherID`),
    CONSTRAINT `uq_publisher_name` UNIQUE (`PublisherName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. Books Table
-- ============================================================================
CREATE TABLE `Books` (
    `ISBN` VARCHAR(20) NOT NULL,
    `Title` VARCHAR(200) NOT NULL,
    `AuthorName` VARCHAR(150) NOT NULL,
    `PublisherID` INT NOT NULL,
    `Price` DECIMAL(10,2) NOT NULL,
    `NoOfPages` INT NULL,
    `Edition` VARCHAR(50) NULL,
    `TotalCopies` INT NOT NULL DEFAULT 0,
    `AvailableCopies` INT NOT NULL DEFAULT 0,
    `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `pk_books` PRIMARY KEY (`ISBN`),
    CONSTRAINT `fk_books_publisher` FOREIGN KEY (`PublisherID`) 
        REFERENCES `Publisher` (`PublisherID`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT `chk_books_price` CHECK (`Price` >= 0),
    CONSTRAINT `chk_books_pages` CHECK (`NoOfPages` IS NULL OR `NoOfPages` > 0),
    CONSTRAINT `chk_books_total_copies` CHECK (`TotalCopies` >= 0),
    CONSTRAINT `chk_books_available_copies` CHECK (`AvailableCopies` >= 0 AND `AvailableCopies` <= `TotalCopies`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. Staff Table
-- ============================================================================
CREATE TABLE `Staff` (
    `StaffID` INT NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(150) NOT NULL,
    `Post` VARCHAR(100) NOT NULL,
    `Email` VARCHAR(150) NOT NULL,
    `ContactNo` VARCHAR(20) NOT NULL,
    `Role` ENUM('Admin', 'Librarian', 'Staff') NOT NULL DEFAULT 'Librarian',
    `PasswordHash` VARCHAR(255) NULL,
    `IsActive` BOOLEAN NOT NULL DEFAULT TRUE,
    `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `pk_staff` PRIMARY KEY (`StaffID`),
    CONSTRAINT `uq_staff_email` UNIQUE (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. Member Table
-- ============================================================================
CREATE TABLE `Member` (
    `MemberID` INT NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(150) NOT NULL,
    `Email` VARCHAR(150) NOT NULL,
    `ContactNo` VARCHAR(20) NOT NULL,
    `MembershipStatus` ENUM('Active', 'Suspended', 'Inactive') NOT NULL DEFAULT 'Active',
    `JoinDate` DATE NOT NULL,
    `Address` VARCHAR(255) NULL,
    `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `pk_member` PRIMARY KEY (`MemberID`),
    CONSTRAINT `uq_member_email` UNIQUE (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. BookIssued Table
-- ============================================================================
CREATE TABLE `BookIssued` (
    `IssueID` INT NOT NULL AUTO_INCREMENT,
    `MemberID` INT NOT NULL,
    `ISBN` VARCHAR(20) NOT NULL,
    `IssuedBy` INT NOT NULL,
    `ReturnedBy` INT NULL,
    `IssueDate` DATE NOT NULL,
    `DueDate` DATE NOT NULL,
    `ReturnDate` DATE NULL,
    `Status` ENUM('Issued', 'Returned', 'Lost') NOT NULL DEFAULT 'Issued',
    `FineAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `FinePaidAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `Notes` VARCHAR(255) NULL,
    `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `pk_bookissued` PRIMARY KEY (`IssueID`),
    CONSTRAINT `fk_bookissued_member` FOREIGN KEY (`MemberID`) 
        REFERENCES `Member` (`MemberID`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_bookissued_books` FOREIGN KEY (`ISBN`) 
        REFERENCES `Books` (`ISBN`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_bookissued_issuedby` FOREIGN KEY (`IssuedBy`) 
        REFERENCES `Staff` (`StaffID`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_bookissued_returnedby` FOREIGN KEY (`ReturnedBy`) 
        REFERENCES `Staff` (`StaffID`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT `chk_bookissued_dates` CHECK (`DueDate` >= `IssueDate`),
    CONSTRAINT `chk_bookissued_returndate` CHECK (`ReturnDate` IS NULL OR `ReturnDate` >= `IssueDate`),
    CONSTRAINT `chk_bookissued_fines` CHECK (`FineAmount` >= 0 AND `FinePaidAmount` >= 0 AND `FinePaidAmount` <= `FineAmount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. Receipt Table
-- ============================================================================
CREATE TABLE `Receipt` (
    `ReceiptID` INT NOT NULL AUTO_INCREMENT,
    `TransactionID` VARCHAR(50) NOT NULL,
    `MemberID` INT NOT NULL,
    `StaffID` INT NOT NULL,
    `IssueID` INT NULL,
    `TransactionType` ENUM('Fine Payment', 'Other Fee', 'Refund') NOT NULL,
    `Amount` DECIMAL(10,2) NOT NULL,
    `PaymentMethod` ENUM('Cash', 'UPI', 'Card', 'Other') NOT NULL,
    `PaymentStatus` ENUM('Completed', 'Pending', 'Cancelled') NOT NULL DEFAULT 'Completed',
    `TransactionDateTime` DATETIME NOT NULL,
    `Remarks` VARCHAR(255) NULL,
    `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `pk_receipt` PRIMARY KEY (`ReceiptID`),
    CONSTRAINT `uq_receipt_transaction_id` UNIQUE (`TransactionID`),
    CONSTRAINT `fk_receipt_member` FOREIGN KEY (`MemberID`) 
        REFERENCES `Member` (`MemberID`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_receipt_staff` FOREIGN KEY (`StaffID`) 
        REFERENCES `Staff` (`StaffID`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_receipt_issue` FOREIGN KEY (`IssueID`) 
        REFERENCES `BookIssued` (`IssueID`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT `chk_receipt_amount` CHECK (`Amount` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. Configuration & Audit Auxiliary Tables
-- ============================================================================
CREATE TABLE `Settings` (
    `SettingKey` VARCHAR(50) NOT NULL,
    `SettingValue` VARCHAR(255) NOT NULL,
    `Description` VARCHAR(255) NULL,
    `UpdatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `pk_settings` PRIMARY KEY (`SettingKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `BookAuditLog` (
    `AuditID` INT NOT NULL AUTO_INCREMENT,
    `ISBN` VARCHAR(20) NOT NULL,
    `ActionType` ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    `OldTotalCopies` INT NULL,
    `NewTotalCopies` INT NULL,
    `OldAvailableCopies` INT NULL,
    `NewAvailableCopies` INT NULL,
    `OldPrice` DECIMAL(10,2) NULL,
    `NewPrice` DECIMAL(10,2) NULL,
    `ChangedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ChangedBy` VARCHAR(100) NULL,
    CONSTRAINT `pk_bookauditlog` PRIMARY KEY (`AuditID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
