-- ============================================================================
-- Library Management System: Seed Data
-- Comprehensive sample dataset demonstrating real-world scenarios:
-- - 6 Publishers
-- - 24 Books (In stock, zero availability, diverse categories)
-- - 6 Staff members (Admin, Librarians, Circulation Staff)
-- - 18 Members (Active, Suspended, Inactive)
-- - 24 Borrowing records (Active, Overdue, Returned on time, Returned late)
-- - 14 Receipts (Cash, UPI, Card, Fine payments, Fees)
-- - Configuration Settings
-- ============================================================================

USE `library_management`;

-- Clean existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `Receipt`;
TRUNCATE TABLE `BookIssued`;
TRUNCATE TABLE `Member`;
TRUNCATE TABLE `Staff`;
TRUNCATE TABLE `Books`;
TRUNCATE TABLE `Publisher`;
TRUNCATE TABLE `BookAuditLog`;
TRUNCATE TABLE `Settings`;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. Configuration Settings
-- ============================================================================
INSERT INTO `Settings` (`SettingKey`, `SettingValue`, `Description`) VALUES
('max_books_per_member', '3', 'Maximum number of active books a member can borrow at one time'),
('loan_duration_days', '14', 'Standard loan duration in days'),
('daily_fine_rate', '5.00', 'Fine charged per day of overdue borrowing in INR'),
('grace_period_days', '0', 'Grace days before overdue fine calculation kicks in'),
('library_name', 'Central College of Engineering & Technology Library', 'Official Library Name'),
('contact_email', 'library@ccet.edu.in', 'Official Library Contact Email');

-- ============================================================================
-- 2. Publishers (6 Publishers)
-- ============================================================================
INSERT INTO `Publisher` (`PublisherID`, `PublisherName`) VALUES
(1, 'Pearson Education'),
(2, 'O''Reilly Media'),
(3, 'McGraw-Hill Higher Education'),
(4, 'MIT Press'),
(5, 'Cambridge University Press'),
(6, 'Oxford University Press');

-- ============================================================================
-- 3. Books (24 Titles)
-- Note: AvailableCopies is set to TotalCopies initially; we will synchronize
-- with active borrowing records after BookIssued is seeded.
-- ============================================================================
INSERT INTO `Books` (`ISBN`, `Title`, `AuthorName`, `PublisherID`, `Price`, `NoOfPages`, `Edition`, `TotalCopies`, `AvailableCopies`) VALUES
('978-0131103627', 'The C Programming Language', 'Brian W. Kernighan, Dennis M. Ritchie', 1, 650.00, 272, '2nd Edition', 5, 5),
('978-0132350884', 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 1, 899.00, 464, '1st Edition', 4, 4),
('978-0262033848', 'Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson', 4, 2150.00, 1312, '3rd Edition', 6, 6),
('978-0596517748', 'JavaScript: The Good Parts', 'Douglas Crockford', 2, 450.00, 176, '1st Edition', 3, 3),
('978-1449331818', 'Learning Python', 'Mark Lutz', 2, 1420.00, 1648, '5th Edition', 4, 4),
('978-1491957660', 'Fluent Python', 'Luciano Ramalho', 2, 1650.00, 792, '2nd Edition', 3, 3),
('978-0073523323', 'Database System Concepts', 'Abraham Silberschatz, Henry F. Korth', 3, 1100.00, 1376, '7th Edition', 5, 5),
('978-0070147331', 'Operating System Principles', 'Peter B. Galvin, Greg Gagne', 3, 980.00, 944, '9th Edition', 4, 4),
('978-0133594140', 'Computer Networking: A Top-Down Approach', 'James Kurose, Keith Ross', 1, 1250.00, 864, '7th Edition', 4, 4),
('978-0262035613', 'Deep Learning', 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', 4, 1850.00, 800, '1st Edition', 3, 3),
('978-1492041139', 'Designing Data-Intensive Applications', 'Martin Kleppmann', 2, 1499.00, 616, '1st Edition', 4, 4),
('978-0521880688', 'Pattern Recognition and Machine Learning', 'Christopher M. Bishop', 5, 2400.00, 738, '1st Edition', 2, 2),
('978-0521642989', 'Quantum Computation and Quantum Information', 'Michael A. Nielsen, Isaac L. Chuang', 5, 2200.00, 702, '10th Anniversary', 2, 2),
('978-0198520115', 'The Emperor''s New Mind', 'Roger Penrose', 6, 750.00, 640, 'Classic Edition', 3, 3),
('978-0199233410', 'The Oxford Handbook of Philosophy of Mind', 'Brian P. McLaughlin', 6, 3100.00, 928, '1st Edition', 2, 2),
('978-0134494166', 'Clean Architecture', 'Robert C. Martin', 1, 950.00, 432, '1st Edition', 4, 4),
('978-1449373320', 'Designing Evolvable Web APIs with ASP.NET', 'Glenn Block', 2, 599.00, 260, '1st Edition', 2, 2),
('978-0072465631', 'Software Engineering: A Practitioner''s Approach', 'Roger S. Pressman', 3, 1150.00, 976, '8th Edition', 4, 4),
('978-0262162098', 'Structure and Interpretation of Computer Programs', 'Harold Abelson, Gerald Jay Sussman', 4, 1750.00, 657, '2nd Edition', 2, 2),
('978-0521865715', 'Information Theory, Inference and Learning Algorithms', 'David J. C. MacKay', 5, 1990.00, 640, '1st Edition', 3, 3),
('978-0199572113', 'Artificial Intelligence: A Very Short Introduction', 'Margaret A. Boden', 6, 350.00, 184, '1st Edition', 5, 5),
('978-0134685991', 'Effective Java', 'Joshua Bloch', 1, 1080.00, 416, '3rd Edition', 3, 3),
('978-1491950357', 'Building Microservices', 'Sam Newman', 2, 1320.00, 612, '2nd Edition', 2, 2),
('978-0071807999', 'Compilers: Principles, Techniques, and Tools', 'Alfred V. Aho, Monica S. Lam', 3, 1400.00, 1040, '2nd Edition', 1, 1);

-- ============================================================================
-- 4. Staff (6 Staff Members)
-- ============================================================================
INSERT INTO `Staff` (`StaffID`, `Name`, `Post`, `Email`, `ContactNo`, `Role`, `PasswordHash`, `IsActive`) VALUES
(1, 'Dr. Rajesh Sharma', 'Chief Librarian', 'rajesh.sharma@ccet.edu.in', '+91 98765 43210', 'Admin', '$2b$10$eW91cnBhc3N3b3JkMQ==', TRUE),
(2, 'Sunita Deshmukh', 'Senior Librarian', 'sunita.deshmukh@ccet.edu.in', '+91 98765 43211', 'Librarian', '$2b$10$eW91cnBhc3N3b3JkMg==', TRUE),
(3, 'Amit Verma', 'Assistant Librarian', 'amit.verma@ccet.edu.in', '+91 98765 43212', 'Librarian', '$2b$10$eW91cnBhc3N3b3JkMw==', TRUE),
(4, 'Pooja Nair', 'Library Assistant', 'pooja.nair@ccet.edu.in', '+91 98765 43213', 'Staff', '$2b$10$eW91cnBhc3N3b3JkNCA=', TRUE),
(5, 'Vikram Malhotra', 'Circulation Officer', 'vikram.malhotra@ccet.edu.in', '+91 98765 43214', 'Staff', '$2b$10$eW91cnBhc3N3b3JkNTA=', TRUE),
(6, 'Deepa Rao', 'Former Cataloger', 'deepa.rao@ccet.edu.in', '+91 98765 43215', 'Staff', '$2b$10$eW91cnBhc3N3b3JkNg==', FALSE);

-- ============================================================================
-- 5. Members (18 Members: Active, Suspended, Inactive)
-- ============================================================================
INSERT INTO `Member` (`MemberID`, `Name`, `Email`, `ContactNo`, `MembershipStatus`, `JoinDate`, `Address`) VALUES
(1, 'Aarav Patel', 'aarav.patel@student.ccet.edu.in', '+91 91234 56701', 'Active', '2025-08-01', 'Room 102, Boys Hostel 1'),
(2, 'Diya Sen', 'diya.sen@student.ccet.edu.in', '+91 91234 56702', 'Active', '2025-08-01', 'Room 205, Girls Hostel 2'),
(3, 'Rohan Kulkarni', 'rohan.k@student.ccet.edu.in', '+91 91234 56703', 'Active', '2025-08-05', 'Sector 4, Gandhinagar'),
(4, 'Ananya Iyer', 'ananya.iyer@student.ccet.edu.in', '+91 91234 56704', 'Active', '2025-08-10', 'Room 312, Girls Hostel 1'),
(5, 'Kabir Mehta', 'kabir.mehta@student.ccet.edu.in', '+91 91234 56705', 'Suspended', '2025-08-12', 'B-14, University Enclave'),
(6, 'Neha Gupta', 'neha.gupta@student.ccet.edu.in', '+91 91234 56706', 'Active', '2025-09-01', 'Room 118, Girls Hostel 2'),
(7, 'Aditya Joshi', 'aditya.joshi@student.ccet.edu.in', '+91 91234 56707', 'Active', '2025-09-01', 'C-44, Shantiniketan'),
(8, 'Tanvi Reddy', 'tanvi.reddy@student.ccet.edu.in', '+91 91234 56708', 'Active', '2025-09-05', 'Room 401, Girls Hostel 3'),
(9, 'Prof. S. R. Raman', 'raman.sr@faculty.ccet.edu.in', '+91 91234 56709', 'Active', '2024-01-15', 'Faculty Quarters Q-12'),
(10, 'Dr. Meenakshi Sundaram', 'meenakshi.s@faculty.ccet.edu.in', '+91 91234 56710', 'Active', '2024-02-01', 'Faculty Quarters Q-08'),
(11, 'Siddharth Rao', 'siddharth.rao@student.ccet.edu.in', '+91 91234 56711', 'Active', '2025-09-10', 'Room 208, Boys Hostel 2'),
(12, 'Priya Nair', 'priya.nair@student.ccet.edu.in', '+91 91234 56712', 'Inactive', '2024-08-01', 'Graduated - Batch 2025'),
(13, 'Varun Chawla', 'varun.chawla@student.ccet.edu.in', '+91 91234 56713', 'Active', '2025-10-01', 'Room 105, Boys Hostel 3'),
(14, 'Ishita Banerjee', 'ishita.b@student.ccet.edu.in', '+91 91234 56714', 'Active', '2025-10-05', 'D-19, Lake View Apartments'),
(15, 'Karan Singhal', 'karan.singhal@student.ccet.edu.in', '+91 91234 56715', 'Suspended', '2025-07-20', 'Sector 15, Vasundhara'),
(16, 'Rhea D''Souza', 'rhea.dsouza@student.ccet.edu.in', '+91 91234 56716', 'Active', '2025-10-10', 'Room 304, Girls Hostel 1'),
(17, 'Manish Tiwari', 'manish.tiwari@student.ccet.edu.in', '+91 91234 56717', 'Active', '2025-10-12', 'Room 110, Boys Hostel 1'),
(18, 'Gauri Bhatt', 'gauri.bhatt@student.ccet.edu.in', '+91 91234 56718', 'Inactive', '2024-08-15', 'Transferred to IIT Bombay');

-- ============================================================================
-- 6. BookIssued (24 Transactions: Returned on time, Returned late, Active, Overdue)
-- Note: Dates are relative to CURDATE() so state is immediately demonstrable
-- ============================================================================
INSERT INTO `BookIssued` (`IssueID`, `MemberID`, `ISBN`, `IssuedBy`, `ReturnedBy`, `IssueDate`, `DueDate`, `ReturnDate`, `Status`, `FineAmount`, `FinePaidAmount`, `Notes`) VALUES
-- 1. Returned on time (Fine = 0)
(1, 1, '978-0131103627', 1, 2, DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_SUB(CURDATE(), INTERVAL 46 DAY), DATE_SUB(CURDATE(), INTERVAL 48 DAY), 'Returned', 0.00, 0.00, 'Returned in good condition'),
-- 2. Returned 5 days late (Assessed fine ₹25, will be fully paid via receipt)
(2, 2, '978-0132350884', 2, 3, DATE_SUB(CURDATE(), INTERVAL 50 DAY), DATE_SUB(CURDATE(), INTERVAL 36 DAY), DATE_SUB(CURDATE(), INTERVAL 31 DAY), 'Returned', 25.00, 0.00, 'Returned with light pencil notes'),
-- 3. Returned 10 days late (Assessed fine ₹50, will be partially paid ₹30 via receipt)
(3, 3, '978-0262033848', 3, 2, DATE_SUB(CURDATE(), INTERVAL 45 DAY), DATE_SUB(CURDATE(), INTERVAL 31 DAY), DATE_SUB(CURDATE(), INTERVAL 21 DAY), 'Returned', 50.00, 0.00, 'Partial fine payment recorded'),
-- 4. Returned 8 days late (Assessed fine ₹40, completely unpaid ₹40)
(4, 5, '978-0596517748', 2, 4, DATE_SUB(CURDATE(), INTERVAL 40 DAY), DATE_SUB(CURDATE(), INTERVAL 26 DAY), DATE_SUB(CURDATE(), INTERVAL 18 DAY), 'Returned', 40.00, 0.00, 'Student suspended pending fine clearance'),
-- 5. Returned on time
(5, 4, '978-1449331818', 1, 1, DATE_SUB(CURDATE(), INTERVAL 35 DAY), DATE_SUB(CURDATE(), INTERVAL 21 DAY), DATE_SUB(CURDATE(), INTERVAL 22 DAY), 'Returned', 0.00, 0.00, 'Regular return'),
-- 6. Returned 4 days late (Assessed fine ₹20, will be fully paid via receipt)
(6, 6, '978-0073523323', 4, 3, DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_SUB(CURDATE(), INTERVAL 16 DAY), DATE_SUB(CURDATE(), INTERVAL 12 DAY), 'Returned', 20.00, 0.00, 'Payment received via UPI'),
-- 7. Returned on time
(7, 7, '978-0070147331', 3, 5, DATE_SUB(CURDATE(), INTERVAL 28 DAY), DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'Returned', 0.00, 0.00, 'Returned on time'),
-- 8. Returned 12 days late (Assessed fine ₹60, will be fully paid via receipt)
(8, 9, '978-0262035613', 1, 2, DATE_SUB(CURDATE(), INTERVAL 55 DAY), DATE_SUB(CURDATE(), INTERVAL 41 DAY), DATE_SUB(CURDATE(), INTERVAL 29 DAY), 'Returned', 60.00, 0.00, 'Faculty return with fine cleared'),
-- 9. Returned on time
(9, 10, '978-1492041139', 2, 1, DATE_SUB(CURDATE(), INTERVAL 25 DAY), DATE_SUB(CURDATE(), INTERVAL 11 DAY), DATE_SUB(CURDATE(), INTERVAL 12 DAY), 'Returned', 0.00, 0.00, 'Faculty loan returned'),
-- 10. Returned 6 days late (Assessed fine ₹30, unpaid ₹30)
(10, 15, '978-0134494166', 5, 2, DATE_SUB(CURDATE(), INTERVAL 35 DAY), DATE_SUB(CURDATE(), INTERVAL 21 DAY), DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'Returned', 30.00, 0.00, 'Unpaid balance'),

-- 11. CURRENT ACTIVE ISSUES (Not overdue)
(11, 1, '978-0262033848', 1, NULL, DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 9 DAY), NULL, 'Issued', 0.00, 0.00, 'Active standard student issue'),
(12, 2, '978-1491957660', 2, NULL, DATE_SUB(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY), NULL, 'Issued', 0.00, 0.00, 'Active student issue'),
(13, 3, '978-0133594140', 3, NULL, DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 11 DAY), NULL, 'Issued', 0.00, 0.00, 'Active student issue'),
(14, 4, '978-0073523323', 4, NULL, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 12 DAY), NULL, 'Issued', 0.00, 0.00, 'Active student issue'),
(15, 6, '978-1492041139', 2, NULL, DATE_SUB(CURDATE(), INTERVAL 6 DAY), DATE_ADD(CURDATE(), INTERVAL 8 DAY), NULL, 'Issued', 0.00, 0.00, 'Active student issue'),
(16, 7, '978-0521880688', 1, NULL, DATE_SUB(CURDATE(), INTERVAL 4 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY), NULL, 'Issued', 0.00, 0.00, 'Active student issue'),
(17, 8, '978-0521642989', 3, NULL, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 13 DAY), NULL, 'Issued', 0.00, 0.00, 'Active student issue'),
(18, 9, '978-0262162098', 1, NULL, DATE_SUB(CURDATE(), INTERVAL 8 DAY), DATE_ADD(CURDATE(), INTERVAL 6 DAY), NULL, 'Issued', 0.00, 0.00, 'Faculty research loan'),
(19, 13, '978-0134685991', 5, NULL, DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 11 DAY), NULL, 'Issued', 0.00, 0.00, 'Active student issue'),
(20, 14, '978-0071807999', 2, NULL, DATE_SUB(CURDATE(), INTERVAL 4 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY), NULL, 'Issued', 0.00, 0.00, 'Active issue (exhausts copy for 978-0071807999)'),

-- 21. CURRENT OVERDUE ISSUES (Currently overdue!)
-- 10 days overdue => estimated fine ₹50
(21, 1, '978-0132350884', 3, NULL, DATE_SUB(CURDATE(), INTERVAL 24 DAY), DATE_SUB(CURDATE(), INTERVAL 10 DAY), NULL, 'Issued', 0.00, 0.00, 'Currently 10 days overdue'),
-- 6 days overdue => estimated fine ₹30
(22, 5, '978-1449331818', 2, NULL, DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 6 DAY), NULL, 'Issued', 0.00, 0.00, 'Currently 6 days overdue'),
-- 15 days overdue => estimated fine ₹75
(23, 11, '978-0521880688', 4, NULL, DATE_SUB(CURDATE(), INTERVAL 29 DAY), DATE_SUB(CURDATE(), INTERVAL 15 DAY), NULL, 'Issued', 0.00, 0.00, 'Currently 15 days overdue (exhausts copy for 978-0521880688)'),
-- 3 days overdue => estimated fine ₹15
(24, 15, '978-1491950357', 1, NULL, DATE_SUB(CURDATE(), INTERVAL 17 DAY), DATE_SUB(CURDATE(), INTERVAL 3 DAY), NULL, 'Issued', 0.00, 0.00, 'Currently 3 days overdue');

-- ============================================================================
-- Synchronize AvailableCopies on Books with active 'Issued' records
-- ============================================================================
UPDATE `Books` b
SET `AvailableCopies` = b.`TotalCopies` - (
    SELECT COUNT(*) 
    FROM `BookIssued` bi 
    WHERE bi.ISBN = b.ISBN AND bi.Status = 'Issued'
);

-- ============================================================================
-- 7. Receipts (14 Receipts: Fine Payments, Other Fees)
-- ============================================================================
INSERT INTO `Receipt` (`ReceiptID`, `TransactionID`, `MemberID`, `StaffID`, `IssueID`, `TransactionType`, `Amount`, `PaymentMethod`, `PaymentStatus`, `TransactionDateTime`, `Remarks`) VALUES
(1, 'TXN-20260901-0001', 2, 3, 2, 'Fine Payment', 25.00, 'UPI', 'Completed', DATE_SUB(NOW(), INTERVAL 31 DAY), 'Full fine payment for Clean Code late return'),
(2, 'TXN-20260910-0002', 3, 2, 3, 'Fine Payment', 30.00, 'Cash', 'Completed', DATE_SUB(NOW(), INTERVAL 21 DAY), 'Partial fine payment for Algorithms late return'),
(3, 'TXN-20260915-0003', 6, 3, 6, 'Fine Payment', 20.00, 'UPI', 'Completed', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Full fine payment for Database Concepts return'),
(4, 'TXN-20260918-0004', 9, 2, 8, 'Fine Payment', 60.00, 'Card', 'Completed', DATE_SUB(NOW(), INTERVAL 29 DAY), 'Full fine payment for Deep Learning return'),
(5, 'TXN-20260920-0005', 1, 1, NULL, 'Other Fee', 100.00, 'Cash', 'Completed', DATE_SUB(NOW(), INTERVAL 20 DAY), 'Annual Library Card Renewal Fee'),
(6, 'TXN-20260922-0006', 4, 1, NULL, 'Other Fee', 100.00, 'UPI', 'Completed', DATE_SUB(NOW(), INTERVAL 18 DAY), 'New Member Registration Fee'),
(7, 'TXN-20260925-0007', 7, 5, NULL, 'Other Fee', 50.00, 'Cash', 'Completed', DATE_SUB(NOW(), INTERVAL 15 DAY), 'Lost ID Card Replacement Fee'),
(8, 'TXN-20260928-0008', 8, 3, NULL, 'Other Fee', 100.00, 'UPI', 'Completed', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Annual Library Card Renewal Fee'),
(9, 'TXN-20261001-0009', 13, 5, NULL, 'Other Fee', 100.00, 'Card', 'Completed', DATE_SUB(NOW(), INTERVAL 9 DAY), 'New Member Registration Fee'),
(10, 'TXN-20261005-0010', 14, 2, NULL, 'Other Fee', 100.00, 'UPI', 'Completed', DATE_SUB(NOW(), INTERVAL 5 DAY), 'New Member Registration Fee'),
(11, 'TXN-20261008-0011', 16, 4, NULL, 'Other Fee', 100.00, 'Cash', 'Completed', DATE_SUB(NOW(), INTERVAL 3 DAY), 'New Member Registration Fee'),
(12, 'TXN-20261010-0012', 17, 1, NULL, 'Other Fee', 100.00, 'UPI', 'Completed', DATE_SUB(NOW(), INTERVAL 2 DAY), 'New Member Registration Fee'),
(13, 'TXN-20261012-0013', 5, 2, NULL, 'Other Fee', 150.00, 'UPI', 'Pending', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Library clearance fee pending verification'),
(14, 'TXN-20261014-0014', 15, 3, NULL, 'Other Fee', 50.00, 'UPI', 'Cancelled', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Payment failed / cancelled by bank gateway');

-- ============================================================================
-- Synchronize FinePaidAmount on BookIssued from recorded completed receipts
-- ============================================================================
UPDATE `BookIssued` bi
SET `FinePaidAmount` = COALESCE((
    SELECT SUM(r.Amount) 
    FROM `Receipt` r 
    WHERE r.IssueID = bi.IssueID 
      AND r.PaymentStatus = 'Completed' 
      AND r.TransactionType = 'Fine Payment'
), 0.00);

