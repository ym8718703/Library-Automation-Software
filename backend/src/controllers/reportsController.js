const { pool } = require('../config/database');

// GET /api/reports/inventory
async function getInventoryReport(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        b.ISBN,
        b.Title,
        b.AuthorName,
        p.PublisherName,
        b.Edition,
        b.Price,
        b.TotalCopies,
        b.AvailableCopies,
        (b.TotalCopies - b.AvailableCopies) AS BorrowedCopies,
        ROUND(b.Price * b.TotalCopies, 2) AS TotalValuation,
        CASE 
          WHEN b.AvailableCopies = 0 THEN 'Out of Stock'
          WHEN b.AvailableCopies < 2 THEN 'Low Stock'
          ELSE 'Available'
        END AS StockStatus
      FROM Books b
      INNER JOIN Publisher p ON b.PublisherID = p.PublisherID
      ORDER BY b.Title ASC
    `);

    const [summary] = await pool.query(`
      SELECT 
        COUNT(*) AS TotalTitles,
        SUM(TotalCopies) AS TotalCopies,
        SUM(AvailableCopies) AS AvailableCopies,
        ROUND(SUM(Price * TotalCopies), 2) AS TotalInventoryValue,
        ROUND(AVG(Price), 2) AS AverageBookPrice
      FROM Books
    `);

    res.json({
      success: true,
      reportType: 'Inventory Report',
      generatedAt: new Date().toISOString(),
      summary: summary[0],
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/reports/available
async function getAvailableBooksReport(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        b.ISBN,
        b.Title,
        b.AuthorName,
        p.PublisherName,
        b.Edition,
        b.Price,
        b.AvailableCopies,
        b.TotalCopies
      FROM Books b
      INNER JOIN Publisher p ON b.PublisherID = p.PublisherID
      WHERE b.AvailableCopies > 0
      ORDER BY b.AvailableCopies DESC, b.Title ASC
    `);

    res.json({
      success: true,
      reportType: 'Available Books Report',
      generatedAt: new Date().toISOString(),
      totalAvailableTitles: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/reports/current-issues
async function getCurrentIssuesReport(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        bi.IssueID,
        bi.ISBN,
        b.Title AS BookTitle,
        bi.MemberID,
        m.Name AS MemberName,
        m.ContactNo AS MemberContact,
        bi.IssueDate,
        bi.DueDate,
        DATEDIFF(CURDATE(), bi.DueDate) AS DaysOverdue,
        CASE 
          WHEN CURDATE() > bi.DueDate THEN 'Overdue'
          ELSE 'On Schedule'
        END AS ScheduleStatus,
        s.Name AS IssuedByStaff
      FROM BookIssued bi
      INNER JOIN Books b ON bi.ISBN = b.ISBN
      INNER JOIN Member m ON bi.MemberID = m.MemberID
      INNER JOIN Staff s ON bi.IssuedBy = s.StaffID
      WHERE bi.Status = 'Issued'
      ORDER BY bi.DueDate ASC
    `);

    res.json({
      success: true,
      reportType: 'Current Issues Report',
      generatedAt: new Date().toISOString(),
      activeIssuesCount: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/reports/overdue
async function getOverdueReport(req, res, next) {
  try {
    const [rows] = await pool.query(`SELECT * FROM vw_OverdueBooks ORDER BY DaysOverdue DESC`);

    const [summary] = await pool.query(`
      SELECT 
        COUNT(*) AS OverdueCount,
        COALESCE(SUM(GREATEST(0, DATEDIFF(CURDATE(), DueDate) * 5.00)), 0.00) AS TotalEstimatedFines
      FROM BookIssued
      WHERE Status = 'Issued' AND CURDATE() > DueDate
    `);

    res.json({
      success: true,
      reportType: 'Overdue Books Report',
      generatedAt: new Date().toISOString(),
      summary: summary[0],
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/reports/member-borrowing
async function getMemberBorrowingReport(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        m.MemberID,
        m.Name AS MemberName,
        m.Email,
        m.MembershipStatus,
        COUNT(bi.IssueID) AS TotalBorrowings,
        SUM(CASE WHEN bi.Status = 'Issued' THEN 1 ELSE 0 END) AS CurrentlyHolding,
        SUM(CASE WHEN bi.Status = 'Issued' AND CURDATE() > bi.DueDate THEN 1 ELSE 0 END) AS CurrentlyOverdue,
        COALESCE(SUM(bi.FineAmount), 0.00) AS TotalFinesAssessed,
        COALESCE(SUM(bi.FinePaidAmount), 0.00) AS TotalFinesPaid,
        COALESCE(SUM(bi.FineAmount - bi.FinePaidAmount), 0.00) AS CurrentOutstandingFines
      FROM Member m
      LEFT JOIN BookIssued bi ON m.MemberID = bi.MemberID
      GROUP BY m.MemberID, m.Name, m.Email, m.MembershipStatus
      ORDER BY TotalBorrowings DESC, m.Name ASC
    `);

    res.json({
      success: true,
      reportType: 'Member Borrowing Summary Report',
      generatedAt: new Date().toISOString(),
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/reports/staff-activity
async function getStaffActivityReport(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM vw_StaffActivity ORDER BY TotalBooksIssued DESC');
    res.json({
      success: true,
      reportType: 'Staff Operations & Activity Report',
      generatedAt: new Date().toISOString(),
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/reports/publisher-inventory
async function getPublisherInventoryReport(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.PublisherID,
        p.PublisherName,
        COUNT(b.ISBN) AS TitleCount,
        COALESCE(SUM(b.TotalCopies), 0) AS TotalCopies,
        COALESCE(SUM(b.AvailableCopies), 0) AS AvailableCopies,
        COALESCE(SUM(b.TotalCopies - b.AvailableCopies), 0) AS BorrowedCopies,
        ROUND(COALESCE(SUM(b.Price * b.TotalCopies), 0), 2) AS CatalogValuation
      FROM Publisher p
      LEFT JOIN Books b ON p.PublisherID = b.PublisherID
      GROUP BY p.PublisherID, p.PublisherName
      ORDER BY TotalCopies DESC
    `);

    res.json({
      success: true,
      reportType: 'Publisher Inventory Report',
      generatedAt: new Date().toISOString(),
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/reports/fine-collection
async function getFineCollectionReport(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const conditions = ['PaymentStatus = "Completed"'];
    const params = [];

    if (startDate) {
      conditions.push('DATE(TransactionDateTime) >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('DATE(TransactionDateTime) <= ?');
      params.push(endDate);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Breakdown by payment method
    const [methodBreakdown] = await pool.query(`
      SELECT 
        PaymentMethod,
        COUNT(*) AS TransactionCount,
        SUM(Amount) AS TotalCollected
      FROM Receipt
      ${whereClause}
      GROUP BY PaymentMethod
      ORDER BY TotalCollected DESC
    `, params);

    // Breakdown by month
    const [monthlyBreakdown] = await pool.query(`
      SELECT 
        DATE_FORMAT(TransactionDateTime, '%Y-%m') AS MonthYear,
        DATE_FORMAT(TransactionDateTime, '%M %Y') AS MonthName,
        COUNT(*) AS TransactionCount,
        SUM(Amount) AS TotalCollected
      FROM Receipt
      ${whereClause}
      GROUP BY MonthYear, MonthName
      ORDER BY MonthYear DESC
    `, params);

    // Detailed transactions
    const [transactions] = await pool.query(`
      SELECT 
        r.ReceiptID,
        r.TransactionID,
        m.Name AS MemberName,
        s.Name AS StaffName,
        r.TransactionType,
        r.Amount,
        r.PaymentMethod,
        r.TransactionDateTime
      FROM Receipt r
      INNER JOIN Member m ON r.MemberID = m.MemberID
      INNER JOIN Staff s ON r.StaffID = s.StaffID
      ${whereClause}
      ORDER BY r.TransactionDateTime DESC
    `, params);

    res.json({
      success: true,
      reportType: 'Fine & Revenue Collection Report',
      generatedAt: new Date().toISOString(),
      methodBreakdown,
      monthlyBreakdown,
      transactions
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/reports/popular-books
async function getPopularBooksReport(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        b.ISBN,
        b.Title,
        b.AuthorName,
        p.PublisherName,
        b.Edition,
        b.TotalCopies,
        b.AvailableCopies,
        COUNT(bi.IssueID) AS TimesBorrowed,
        COUNT(DISTINCT bi.MemberID) AS UniqueBorrowers
      FROM Books b
      INNER JOIN Publisher p ON b.PublisherID = p.PublisherID
      LEFT JOIN BookIssued bi ON b.ISBN = bi.ISBN
      GROUP BY b.ISBN, b.Title, b.AuthorName, p.PublisherName, b.Edition, b.TotalCopies, b.AvailableCopies
      ORDER BY TimesBorrowed DESC, b.Title ASC
    `);

    res.json({
      success: true,
      reportType: 'Most Borrowed Books Report',
      generatedAt: new Date().toISOString(),
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getInventoryReport,
  getAvailableBooksReport,
  getCurrentIssuesReport,
  getOverdueReport,
  getMemberBorrowingReport,
  getStaffActivityReport,
  getPublisherInventoryReport,
  getFineCollectionReport,
  getPopularBooksReport
};
