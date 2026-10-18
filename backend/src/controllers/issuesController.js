const { pool } = require('../config/database');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/helpers');

// GET /api/issues
async function getAllIssues(req, res, next) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const status = req.query.status; // 'Issued', 'Returned', 'Lost', 'all'
    const isOverdue = req.query.overdue === 'true';
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    const memberId = req.query.memberId ? parseInt(req.query.memberId, 10) : null;
    const isbn = req.query.isbn ? req.query.isbn.trim() : null;

    const conditions = [];
    const params = [];

    if (status && ['Issued', 'Returned', 'Lost'].includes(status)) {
      conditions.push('bi.Status = ?');
      params.push(status);
    }

    if (isOverdue) {
      conditions.push('bi.Status = "Issued" AND CURDATE() > bi.DueDate');
    }

    if (memberId && !isNaN(memberId)) {
      conditions.push('bi.MemberID = ?');
      params.push(memberId);
    }

    if (isbn) {
      conditions.push('bi.ISBN = ?');
      params.push(isbn);
    }

    if (search) {
      conditions.push('(b.Title LIKE ? OR m.Name LIKE ? OR bi.ISBN LIKE ? OR CAST(bi.IssueID AS CHAR) LIKE ?)');
      params.push(search, search, search, search);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) AS total 
      FROM BookIssued bi
      INNER JOIN Books b ON bi.ISBN = b.ISBN
      INNER JOIN Member m ON bi.MemberID = m.MemberID
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    const dataSql = `
      SELECT 
        bi.IssueID,
        bi.MemberID,
        m.Name AS MemberName,
        m.Email AS MemberEmail,
        bi.ISBN,
        b.Title AS BookTitle,
        b.AuthorName AS BookAuthor,
        bi.IssuedBy,
        s1.Name AS IssuedByStaff,
        bi.ReturnedBy,
        s2.Name AS ReturnedByStaff,
        bi.IssueDate,
        bi.DueDate,
        bi.ReturnDate,
        bi.Status,
        bi.FineAmount,
        bi.FinePaidAmount,
        (bi.FineAmount - bi.FinePaidAmount) AS OutstandingFine,
        DATEDIFF(CURDATE(), bi.DueDate) AS DaysOverdue,
        CASE 
          WHEN bi.Status = 'Issued' AND CURDATE() > bi.DueDate THEN 'Overdue'
          WHEN bi.Status = 'Issued' THEN 'Active'
          ELSE bi.Status
        END AS LoanState
      FROM BookIssued bi
      INNER JOIN Books b ON bi.ISBN = b.ISBN
      INNER JOIN Member m ON bi.MemberID = m.MemberID
      INNER JOIN Staff s1 ON bi.IssuedBy = s1.StaffID
      LEFT JOIN Staff s2 ON bi.ReturnedBy = s2.StaffID
      ${whereClause}
      ORDER BY bi.IssueID DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limit, offset]);

    res.json(formatPaginatedResponse(rows, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// GET /api/issues/:id
async function getIssueById(req, res, next) {
  try {
    const issueId = parseInt(req.params.id, 10);
    if (isNaN(issueId)) {
      return res.status(400).json({ success: false, message: 'Invalid Issue ID' });
    }

    const [rows] = await pool.query(
      `SELECT 
        bi.IssueID,
        bi.MemberID,
        m.Name AS MemberName,
        m.Email AS MemberEmail,
        m.ContactNo AS MemberContact,
        bi.ISBN,
        b.Title AS BookTitle,
        b.AuthorName AS BookAuthor,
        p.PublisherName,
        bi.IssuedBy,
        s1.Name AS IssuedByStaff,
        bi.ReturnedBy,
        s2.Name AS ReturnedByStaff,
        bi.IssueDate,
        bi.DueDate,
        bi.ReturnDate,
        bi.Status,
        bi.FineAmount,
        bi.FinePaidAmount,
        (bi.FineAmount - bi.FinePaidAmount) AS OutstandingBalance,
        bi.Notes,
        DATEDIFF(CURDATE(), bi.DueDate) AS DaysOverdue
      FROM BookIssued bi
      INNER JOIN Books b ON bi.ISBN = b.ISBN
      INNER JOIN Publisher p ON b.PublisherID = p.PublisherID
      INNER JOIN Member m ON bi.MemberID = m.MemberID
      INNER JOIN Staff s1 ON bi.IssuedBy = s1.StaffID
      LEFT JOIN Staff s2 ON bi.ReturnedBy = s2.StaffID
      WHERE bi.IssueID = ?`,
      [issueId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Issue record not found' });
    }

    // Receipts associated with this issue
    const [receipts] = await pool.query(
      `SELECT 
        r.ReceiptID,
        r.TransactionID,
        r.Amount,
        r.PaymentMethod,
        r.PaymentStatus,
        r.TransactionDateTime,
        s.Name AS StaffName
      FROM Receipt r
      INNER JOIN Staff s ON r.StaffID = s.StaffID
      WHERE r.IssueID = ?
      ORDER BY r.TransactionDateTime DESC`,
      [issueId]
    );

    res.json({
      success: true,
      data: {
        ...rows[0],
        receipts
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/issues/overdue
async function getOverdueIssues(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM vw_OverdueBooks');
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/issues (Issue a book)
async function issueBook(req, res, next) {
  try {
    const { MemberID, ISBN, StaffID } = req.body;

    if (!MemberID || !ISBN || !StaffID) {
      return res.status(400).json({
        success: false,
        message: 'MemberID, ISBN, and StaffID are required to issue a book.'
      });
    }

    // Execute stored procedure with session variables
    const [resultSets] = await pool.query(`
      CALL sp_IssueBook(?, ?, ?, @p_IssueID, @p_DueDate, @p_StatusMessage);
      SELECT @p_IssueID AS IssueID, @p_DueDate AS DueDate, @p_StatusMessage AS StatusMessage;
    `, [parseInt(MemberID, 10), ISBN.trim(), parseInt(StaffID, 10)]);

    // resultSets[1] contains the SELECT outputs
    const spOutput = Array.isArray(resultSets) && resultSets.length > 1 ? resultSets[1][0] : null;

    if (!spOutput) {
      return res.status(500).json({ success: false, message: 'Unexpected database procedure response.' });
    }

    if (spOutput.StatusMessage !== 'SUCCESS') {
      return res.status(400).json({
        success: false,
        message: spOutput.StatusMessage.replace(/^ERROR:\s*/, '')
      });
    }

    res.status(201).json({
      success: true,
      message: 'Book issued successfully',
      data: {
        IssueID: spOutput.IssueID,
        DueDate: spOutput.DueDate,
        MemberID: parseInt(MemberID, 10),
        ISBN: ISBN.trim()
      }
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/issues/:id/return (Return a book)
async function returnBook(req, res, next) {
  try {
    const issueId = parseInt(req.params.id, 10);
    const { StaffID } = req.body;

    if (isNaN(issueId)) {
      return res.status(400).json({ success: false, message: 'Invalid Issue ID' });
    }
    if (!StaffID) {
      return res.status(400).json({ success: false, message: 'Returning StaffID is required.' });
    }

    const [resultSets] = await pool.query(`
      CALL sp_ReturnBook(?, ?, @p_FineAssessed, @p_DaysOverdue, @p_StatusMessage);
      SELECT @p_FineAssessed AS FineAssessed, @p_DaysOverdue AS DaysOverdue, @p_StatusMessage AS StatusMessage;
    `, [issueId, parseInt(StaffID, 10)]);

    const spOutput = Array.isArray(resultSets) && resultSets.length > 1 ? resultSets[1][0] : null;

    if (!spOutput) {
      return res.status(500).json({ success: false, message: 'Unexpected database procedure response.' });
    }

    if (spOutput.StatusMessage !== 'SUCCESS') {
      return res.status(400).json({
        success: false,
        message: spOutput.StatusMessage.replace(/^ERROR:\s*/, '')
      });
    }

    const fineAssessed = parseFloat(spOutput.FineAssessed) || 0;
    const daysOverdue = parseInt(spOutput.DaysOverdue, 10) || 0;

    res.json({
      success: true,
      message: fineAssessed > 0 
        ? `Book returned successfully. Overdue fine assessed: ₹${fineAssessed.toFixed(2)} (${daysOverdue} days overdue).`
        : 'Book returned on time with zero fine.',
      data: {
        IssueID: issueId,
        DaysOverdue: daysOverdue,
        FineAssessed: fineAssessed
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/fines (Fine Management)
async function getFines(req, res, next) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const filter = req.query.filter; // 'unpaid', 'partially-paid', 'fully-paid', 'all'
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;

    const conditions = ['bi.FineAmount > 0'];
    const params = [];

    if (filter === 'unpaid') {
      conditions.push('bi.FinePaidAmount = 0');
    } else if (filter === 'partially-paid') {
      conditions.push('bi.FinePaidAmount > 0 AND bi.FinePaidAmount < bi.FineAmount');
    } else if (filter === 'fully-paid') {
      conditions.push('bi.FinePaidAmount = bi.FineAmount');
    } else if (filter === 'outstanding') {
      conditions.push('(bi.FineAmount - bi.FinePaidAmount) > 0');
    }

    if (search) {
      conditions.push('(m.Name LIKE ? OR b.Title LIKE ? OR CAST(bi.IssueID AS CHAR) LIKE ?)');
      params.push(search, search, search);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `
      SELECT COUNT(*) AS total 
      FROM BookIssued bi
      INNER JOIN Member m ON bi.MemberID = m.MemberID
      INNER JOIN Books b ON bi.ISBN = b.ISBN
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    const dataSql = `
      SELECT 
        bi.IssueID,
        bi.MemberID,
        m.Name AS MemberName,
        m.Email AS MemberEmail,
        bi.ISBN,
        b.Title AS BookTitle,
        bi.IssueDate,
        bi.DueDate,
        bi.ReturnDate,
        bi.Status,
        bi.FineAmount,
        bi.FinePaidAmount,
        (bi.FineAmount - bi.FinePaidAmount) AS OutstandingBalance,
        CASE 
          WHEN bi.FinePaidAmount = 0 THEN 'Unpaid'
          WHEN bi.FinePaidAmount < bi.FineAmount THEN 'Partially Paid'
          ELSE 'Fully Paid'
        END AS PaymentState
      FROM BookIssued bi
      INNER JOIN Member m ON bi.MemberID = m.MemberID
      INNER JOIN Books b ON bi.ISBN = b.ISBN
      ${whereClause}
      ORDER BY OutstandingBalance DESC, bi.IssueID DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limit, offset]);

    res.json(formatPaginatedResponse(rows, total, page, limit));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllIssues,
  getIssueById,
  getOverdueIssues,
  issueBook,
  returnBook,
  getFines
};
