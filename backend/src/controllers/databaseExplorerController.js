const { pool } = require('../config/database');

// Predefined DBMS Demonstration Queries Catalog
const PREDEFINED_QUERIES = [
  {
    id: 'query-1',
    title: 'Display Books with Publisher Names',
    category: 'SQL Joins',
    tablesInvolved: ['Books', 'Publisher'],
    concepts: ['INNER JOIN', 'Projection', 'Alphabetical Sorting'],
    purpose: 'Demonstrates a classic 1-to-Many relational join resolving PublisherID foreign key into human-readable publisher names.',
    sql: `SELECT 
    b.ISBN,
    b.Title,
    b.AuthorName,
    p.PublisherName,
    b.Price,
    b.AvailableCopies,
    b.TotalCopies
FROM Books b
INNER JOIN Publisher p ON b.PublisherID = p.PublisherID
ORDER BY b.Title ASC
LIMIT 15;`
  },
  {
    id: 'query-2',
    title: 'All Currently Issued Books with Borrower & Staff',
    category: 'SQL Joins',
    tablesInvolved: ['BookIssued', 'Books', 'Member', 'Staff'],
    concepts: ['Multi-table INNER JOIN', 'Date Ordering', 'State Filtering'],
    purpose: 'Joins 4 core tables simultaneously to produce an operational circulation roster of active loans.',
    sql: `SELECT 
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
ORDER BY bi.DueDate ASC;`
  },
  {
    id: 'query-3',
    title: 'Overdue Books with Penalty Calculation',
    category: 'SQL Joins',
    tablesInvolved: ['BookIssued', 'Books', 'Member'],
    concepts: ['Temporal Functions (CURDATE, DATEDIFF)', 'Arithmetic Expression', 'WHERE Filter'],
    purpose: 'Calculates overdue days dynamically using server date and projects the current financial penalty.',
    sql: `SELECT 
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
ORDER BY DaysOverdue DESC;`
  },
  {
    id: 'query-4',
    title: 'Member Borrowing History',
    category: 'SQL Joins',
    tablesInvolved: ['BookIssued', 'Books', 'Member'],
    concepts: ['Parameterized Filter', 'Reverse Chronological Order'],
    purpose: 'Fetches the complete lending audit trail for a designated member including return statuses and fines.',
    sql: `SELECT 
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
ORDER BY bi.IssueDate DESC;`
  },
  {
    id: 'query-5',
    title: 'Receipts with Member and Staff Names',
    category: 'SQL Joins',
    tablesInvolved: ['Receipt', 'Member', 'Staff'],
    concepts: ['Multi-table JOIN', 'Timestamp Formatting', 'Payment Auditing'],
    purpose: 'Resolves financial receipts with full identity information for both member paying and staff receiving.',
    sql: `SELECT 
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
ORDER BY r.TransactionDateTime DESC
LIMIT 10;`
  },
  {
    id: 'query-6',
    title: 'Fines and Outstanding Balances',
    category: 'SQL Joins',
    tablesInvolved: ['BookIssued', 'Member', 'Books'],
    concepts: ['Calculated Columns', 'Derived Balance', 'Conditional Filter'],
    purpose: 'Identifies all borrowings where assessed fine exceeds the paid amount to drive collections.',
    sql: `SELECT 
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
ORDER BY OutstandingBalance DESC;`
  },
  {
    id: 'query-7',
    title: 'Publisher-wise Inventory Breakdown',
    category: 'Aggregates & Grouping',
    tablesInvolved: ['Publisher', 'Books'],
    concepts: ['LEFT JOIN', 'COUNT()', 'SUM()', 'GROUP BY', 'COALESCE()'],
    purpose: 'Aggregates catalog titles, total physical inventory, and borrowed stock grouped by publisher.',
    sql: `SELECT 
    p.PublisherID,
    p.PublisherName,
    COUNT(b.ISBN) AS TotalTitles,
    COALESCE(SUM(b.TotalCopies), 0) AS TotalStock,
    COALESCE(SUM(b.AvailableCopies), 0) AS AvailableStock,
    COALESCE(SUM(b.TotalCopies - b.AvailableCopies), 0) AS BorrowedStock
FROM Publisher p
LEFT JOIN Books b ON p.PublisherID = b.PublisherID
GROUP BY p.PublisherID, p.PublisherName
ORDER BY TotalTitles DESC;`
  },
  {
    id: 'query-8',
    title: 'Staff Operational Activity (No Join Duplication)',
    category: 'Aggregates & Grouping',
    tablesInvolved: ['Staff', 'BookIssued', 'Receipt'],
    concepts: ['Subquery Pre-aggregation', 'LEFT JOIN', 'Elimination of Cartesian Duplication'],
    purpose: 'Calculates operational workload per staff member without inflating metrics via Cartesian join explosions.',
    sql: `SELECT 
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
ORDER BY s.StaffID;`
  },
  {
    id: 'query-9',
    title: 'Catalog Inventory & Pricing Statistical Summary',
    category: 'Aggregate Functions',
    tablesInvolved: ['Books'],
    concepts: ['COUNT()', 'SUM()', 'MIN()', 'MAX()', 'AVG()', 'ROUND()'],
    purpose: 'Demonstrates all fundamental ANSI SQL aggregate functions applied across catalog pricing and copy levels.',
    sql: `SELECT 
    COUNT(*) AS UniqueTitles,
    SUM(TotalCopies) AS TotalPhysicalCopies,
    SUM(AvailableCopies) AS AvailablePhysicalCopies,
    SUM(TotalCopies - AvailableCopies) AS CurrentlyIssuedCopies,
    MIN(Price) AS LowestPrice,
    MAX(Price) AS HighestPrice,
    ROUND(AVG(Price), 2) AS AverageBookPrice
FROM Books;`
  },
  {
    id: 'query-10',
    title: 'Publishers with Multiple Titles (HAVING Clause)',
    category: 'Aggregates & Grouping',
    tablesInvolved: ['Publisher', 'Books'],
    concepts: ['GROUP BY', 'HAVING Filter on Aggregate', 'COUNT()', 'SUM()'],
    purpose: 'Demonstrates post-aggregation filtering using HAVING to identify major publishers with 3 or more titles.',
    sql: `SELECT 
    p.PublisherName,
    COUNT(b.ISBN) AS TitleCount,
    SUM(b.TotalCopies) AS TotalCopies
FROM Publisher p
INNER JOIN Books b ON p.PublisherID = b.PublisherID
GROUP BY p.PublisherID, p.PublisherName
HAVING COUNT(b.ISBN) >= 3
ORDER BY TitleCount DESC;`
  },
  {
    id: 'query-11',
    title: 'Members with Multiple Borrowings (HAVING Clause)',
    category: 'Aggregates & Grouping',
    tablesInvolved: ['Member', 'BookIssued'],
    concepts: ['GROUP BY', 'HAVING COUNT > 1', 'Frequency Analysis'],
    purpose: 'Filters groups to find members who have engaged in multiple borrowing transactions.',
    sql: `SELECT 
    m.MemberID,
    m.Name AS MemberName,
    m.Email,
    COUNT(bi.IssueID) AS TotalBorrowings
FROM Member m
INNER JOIN BookIssued bi ON m.MemberID = bi.MemberID
GROUP BY m.MemberID, m.Name, m.Email
HAVING COUNT(bi.IssueID) > 1
ORDER BY TotalBorrowings DESC;`
  },
  {
    id: 'query-12',
    title: 'Monthly Fine Collections Summary',
    category: 'Aggregates & Grouping',
    tablesInvolved: ['Receipt'],
    concepts: ['DATE_FORMAT', 'GROUP BY Month', 'SUM()', 'WHERE Clause'],
    purpose: 'Aggregates financial collection figures by monthly reporting intervals.',
    sql: `SELECT 
    DATE_FORMAT(TransactionDateTime, '%Y-%m') AS YearMonth,
    COUNT(*) AS TotalTransactions,
    SUM(Amount) AS TotalCollectedINR
FROM Receipt
WHERE TransactionType = 'Fine Payment' AND PaymentStatus = 'Completed'
GROUP BY DATE_FORMAT(TransactionDateTime, '%Y-%m')
ORDER BY YearMonth DESC;`
  },
  {
    id: 'query-13',
    title: 'Books Never Borrowed (Subquery NOT IN)',
    category: 'Subqueries',
    tablesInvolved: ['Books', 'BookIssued', 'Publisher'],
    concepts: ['Subquery with NOT IN', 'Uncorrelated Subquery', 'Set Negation'],
    purpose: 'Identifies stagnant inventory titles that have never experienced a checkout record.',
    sql: `SELECT 
    b.ISBN,
    b.Title,
    b.AuthorName,
    p.PublisherName,
    b.TotalCopies
FROM Books b
INNER JOIN Publisher p ON b.PublisherID = p.PublisherID
WHERE b.ISBN NOT IN (SELECT DISTINCT ISBN FROM BookIssued)
ORDER BY b.Title ASC;`
  },
  {
    id: 'query-14',
    title: 'Members Who Never Borrowed a Book (NOT EXISTS Subquery)',
    category: 'Subqueries',
    tablesInvolved: ['Member', 'BookIssued'],
    concepts: ['Correlated Subquery', 'NOT EXISTS Operator', 'Set Difference'],
    purpose: 'Demonstrates correlated subquery performance to find inactive or newly registered members.',
    sql: `SELECT 
    m.MemberID,
    m.Name,
    m.Email,
    m.MembershipStatus,
    m.JoinDate
FROM Member m
WHERE NOT EXISTS (
    SELECT 1 FROM BookIssued bi WHERE bi.MemberID = m.MemberID
)
ORDER BY m.MemberID ASC;`
  },
  {
    id: 'query-15',
    title: 'Books Borrowed More Frequently than Average',
    category: 'Subqueries',
    tablesInvolved: ['Books', 'BookIssued'],
    concepts: ['Nested Subqueries', 'Derived Tables', 'AVG() Comparison'],
    purpose: 'Compares each book borrowing count against the overall catalog average borrowing rate.',
    sql: `SELECT 
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
ORDER BY borrow_counts.BorrowCount DESC;`
  },
  {
    id: 'query-16',
    title: 'Highest Priced Books in the Catalog',
    category: 'Subqueries',
    tablesInvolved: ['Books', 'Publisher'],
    concepts: ['Scalar Subquery', 'MAX() Function', 'Exact Value Matching'],
    purpose: 'Finds the most valuable book titles using a scalar subquery.',
    sql: `SELECT 
    b.ISBN,
    b.Title,
    b.AuthorName,
    p.PublisherName,
    b.Price
FROM Books b
INNER JOIN Publisher p ON b.PublisherID = p.PublisherID
WHERE b.Price = (SELECT MAX(Price) FROM Books);`
  },
  {
    id: 'query-17',
    title: 'Members with Active Overdue Books',
    category: 'Aggregates & Grouping',
    tablesInvolved: ['Member', 'BookIssued'],
    concepts: ['GROUP BY', 'HAVING', 'Temporal Filtering'],
    purpose: 'Groups members and identifies those currently holding one or more overdue loans.',
    sql: `SELECT 
    m.MemberID,
    m.Name,
    m.Email,
    COUNT(*) AS OverdueBookCount
FROM BookIssued bi
INNER JOIN Member m ON bi.MemberID = m.MemberID
WHERE bi.Status = 'Issued' AND CURDATE() > bi.DueDate
GROUP BY m.MemberID, m.Name, m.Email
HAVING COUNT(*) >= 1;`
  }
];

// GET /api/explorer/tables
async function getTablesOverview(req, res, next) {
  try {
    const tableNames = ['Publisher', 'Books', 'Staff', 'Member', 'BookIssued', 'Receipt'];
    const tablesData = [];

    for (const tableName of tableNames) {
      // 1. Columns & Types
      const [columns] = await pool.query(`
        SELECT 
          COLUMN_NAME,
          COLUMN_TYPE,
          IS_NULLABLE,
          COLUMN_KEY,
          COLUMN_DEFAULT,
          EXTRA
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION ASC
      `, [tableName]);

      // 2. Primary Keys & Foreign Keys
      const [keys] = await pool.query(`
        SELECT 
          k.COLUMN_NAME,
          k.CONSTRAINT_NAME,
          k.REFERENCED_TABLE_NAME,
          k.REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE k
        WHERE k.TABLE_SCHEMA = DATABASE() AND k.TABLE_NAME = ?
      `, [tableName]);

      // 3. Row count
      const [countResult] = await pool.query(`SELECT COUNT(*) AS totalRows FROM \`${tableName}\``);

      // 4. Schema descriptions
      const descriptions = {
        'Publisher': 'Stores publishing house identities and publication entities.',
        'Books': 'Stores book titles, editions, pricing, and controlled inventory levels.',
        'Staff': 'Records library personnel responsible for operational authorizations.',
        'Member': 'Maintains patron demographics, contact data, and active eligibility status.',
        'BookIssued': 'Associative entity managing individual borrowing sessions and penalties.',
        'Receipt': 'Immutable financial audit log recording all fee and fine collections.'
      };

      tablesData.push({
        tableName,
        description: descriptions[tableName] || '',
        totalRows: countResult[0].totalRows,
        columns,
        keys
      });
    }

    res.json({
      success: true,
      data: tablesData
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/explorer/queries
async function getPredefinedQueries(req, res) {
  res.json({
    success: true,
    data: PREDEFINED_QUERIES
  });
}

// POST /api/explorer/run-query
async function runPredefinedQuery(req, res, next) {
  try {
    const { queryId } = req.body;
    const queryObj = PREDEFINED_QUERIES.find(q => q.id === queryId);

    if (!queryObj) {
      return res.status(404).json({
        success: false,
        message: 'Predefined query not found. Custom arbitrary SQL execution is prohibited for security.'
      });
    }

    const startTime = process.hrtime();
    const [rows, fields] = await pool.query(queryObj.sql);
    const diff = process.hrtime(startTime);
    const executionTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

    const columnNames = fields ? fields.map(f => f.name) : (rows.length > 0 ? Object.keys(rows[0]) : []);

    res.json({
      success: true,
      queryId: queryObj.id,
      title: queryObj.title,
      sql: queryObj.sql,
      executionTimeMs,
      rowCount: rows.length,
      columns: columnNames,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/explorer/objects (Views, Procedures, Triggers, Indexes)
async function getDatabaseObjects(req, res, next) {
  try {
    // 1. Views
    const [views] = await pool.query(`
      SELECT TABLE_NAME AS ViewName, VIEW_DEFINITION AS Definition
      FROM information_schema.VIEWS
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME ASC
    `);

    // 2. Stored Procedures
    const [procedures] = await pool.query(`
      SELECT ROUTINE_NAME AS ProcedureName, ROUTINE_TYPE AS RoutineType, CREATED, LAST_ALTERED
      FROM information_schema.ROUTINES
      WHERE ROUTINE_SCHEMA = DATABASE()
      ORDER BY ROUTINE_NAME ASC
    `);

    // 3. Triggers
    const [triggers] = await pool.query(`
      SELECT TRIGGER_NAME AS TriggerName, EVENT_MANIPULATION AS Event, EVENT_OBJECT_TABLE AS TargetTable, ACTION_TIMING AS Timing
      FROM information_schema.TRIGGERS
      WHERE TRIGGER_SCHEMA = DATABASE()
      ORDER BY TRIGGER_NAME ASC
    `);

    // 4. Indexes
    const [indexes] = await pool.query(`
      SELECT 
        TABLE_NAME AS TableName,
        INDEX_NAME AS IndexName,
        NON_UNIQUE = 0 AS IsUnique,
        GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS Columns
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
      ORDER BY TABLE_NAME ASC, INDEX_NAME ASC
    `);

    res.json({
      success: true,
      data: {
        views,
        procedures,
        triggers,
        indexes
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTablesOverview,
  getPredefinedQueries,
  runPredefinedQuery,
  getDatabaseObjects
};
