const { pool } = require('../config/database');

// GET /api/dashboard/stats
async function getDashboardStats(req, res, next) {
  try {
    // 1. Core Summary Metrics (Single aggregated queries)
    const [bookStats] = await pool.query(`
      SELECT 
        COUNT(*) AS TotalTitles,
        COALESCE(SUM(TotalCopies), 0) AS TotalCopies,
        COALESCE(SUM(AvailableCopies), 0) AS AvailableCopies,
        COALESCE(SUM(TotalCopies - AvailableCopies), 0) AS CurrentlyIssuedCopies
      FROM Books
    `);

    const [issueStats] = await pool.query(`
      SELECT 
        COUNT(*) AS TotalTransactions,
        SUM(CASE WHEN Status = 'Issued' THEN 1 ELSE 0 END) AS CurrentlyIssuedCount,
        SUM(CASE WHEN Status = 'Issued' AND CURDATE() > DueDate THEN 1 ELSE 0 END) AS OverdueCount,
        COALESCE(SUM(FineAmount - FinePaidAmount), 0.00) AS TotalOutstandingFines
      FROM BookIssued
    `);

    const [memberStats] = await pool.query(`
      SELECT 
        COUNT(*) AS TotalMembers,
        SUM(CASE WHEN MembershipStatus = 'Active' THEN 1 ELSE 0 END) AS ActiveMembers
      FROM Member
    `);

    const [staffStats] = await pool.query(`
      SELECT 
        COUNT(*) AS TotalStaff,
        SUM(CASE WHEN IsActive = TRUE THEN 1 ELSE 0 END) AS ActiveStaff
      FROM Staff
    `);

    const [receiptStats] = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN TransactionType = 'Fine Payment' AND PaymentStatus = 'Completed' THEN Amount ELSE 0 END), 0.00) AS TotalFineCollected,
        COALESCE(SUM(CASE WHEN PaymentStatus = 'Completed' THEN Amount ELSE 0 END), 0.00) AS TotalRevenueCollected
      FROM Receipt
    `);

    // 2. Monthly Issue Trends (Last 6 Months)
    const [monthlyIssues] = await pool.query(`
      SELECT 
        DATE_FORMAT(IssueDate, '%Y-%m') AS MonthYear,
        DATE_FORMAT(IssueDate, '%b %Y') AS MonthLabel,
        COUNT(*) AS IssueCount
      FROM BookIssued
      WHERE IssueDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY MonthYear, MonthLabel
      ORDER BY MonthYear ASC
    `);

    // 3. Monthly Fine Collection Trends (Last 6 Months)
    const [monthlyFines] = await pool.query(`
      SELECT 
        DATE_FORMAT(TransactionDateTime, '%Y-%m') AS MonthYear,
        DATE_FORMAT(TransactionDateTime, '%b %Y') AS MonthLabel,
        COALESCE(SUM(Amount), 0.00) AS TotalCollected
      FROM Receipt
      WHERE PaymentStatus = 'Completed' 
        AND TransactionDateTime >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY MonthYear, MonthLabel
      ORDER BY MonthYear ASC
    `);

    // 4. Most Borrowed Books (Top 5)
    const [popularBooks] = await pool.query(`
      SELECT 
        b.ISBN,
        b.Title,
        b.AuthorName,
        p.PublisherName,
        COUNT(bi.IssueID) AS BorrowCount
      FROM Books b
      INNER JOIN Publisher p ON b.PublisherID = p.PublisherID
      INNER JOIN BookIssued bi ON b.ISBN = bi.ISBN
      GROUP BY b.ISBN, b.Title, b.AuthorName, p.PublisherName
      ORDER BY BorrowCount DESC
      LIMIT 5
    `);

    // 5. Publisher Inventory Breakdown (Top 6)
    const [publisherDistribution] = await pool.query(`
      SELECT 
        p.PublisherName,
        COUNT(b.ISBN) AS TitleCount,
        COALESCE(SUM(b.TotalCopies), 0) AS TotalCopies
      FROM Publisher p
      LEFT JOIN Books b ON p.PublisherID = b.PublisherID
      GROUP BY p.PublisherID, p.PublisherName
      ORDER BY TotalCopies DESC
      LIMIT 6
    `);

    // 6. Recent Transaction Activity (Last 8)
    const [recentActivity] = await pool.query(`
      SELECT 
        bi.IssueID,
        bi.ISBN,
        b.Title AS BookTitle,
        m.Name AS MemberName,
        bi.IssueDate,
        bi.DueDate,
        bi.ReturnDate,
        bi.Status,
        bi.FineAmount,
        s.Name AS StaffName
      FROM BookIssued bi
      INNER JOIN Books b ON bi.ISBN = b.ISBN
      INNER JOIN Member m ON bi.MemberID = m.MemberID
      INNER JOIN Staff s ON bi.IssuedBy = s.StaffID
      ORDER BY bi.IssueID DESC
      LIMIT 8
    `);

    res.json({
      success: true,
      data: {
        summary: {
          totalTitles: bookStats[0].TotalTitles,
          totalCopies: bookStats[0].TotalCopies,
          availableCopies: bookStats[0].AvailableCopies,
          issuedCopies: bookStats[0].CurrentlyIssuedCopies,
          currentlyIssuedBooks: issueStats[0].CurrentlyIssuedCount,
          overdueBooks: issueStats[0].OverdueCount,
          totalMembers: memberStats[0].TotalMembers,
          activeMembers: memberStats[0].ActiveMembers,
          totalStaff: staffStats[0].TotalStaff,
          activeStaff: staffStats[0].ActiveStaff,
          totalOutstandingFines: parseFloat(issueStats[0].TotalOutstandingFines),
          totalFineCollected: parseFloat(receiptStats[0].TotalFineCollected),
          totalRevenueCollected: parseFloat(receiptStats[0].TotalRevenueCollected)
        },
        monthlyIssues,
        monthlyFines,
        popularBooks,
        publisherDistribution,
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats
};
