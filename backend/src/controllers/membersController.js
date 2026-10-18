const { pool } = require('../config/database');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/helpers');

// GET /api/members
async function getAllMembers(req, res, next) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    const status = req.query.status; // 'Active', 'Suspended', 'Inactive', 'all'
    const sortBy = req.query.sortBy || 'Name';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(m.Name LIKE ? OR m.Email LIKE ? OR m.ContactNo LIKE ? OR CAST(m.MemberID AS CHAR) LIKE ?)');
      params.push(search, search, search, search);
    }

    if (status && ['Active', 'Suspended', 'Inactive'].includes(status)) {
      conditions.push('m.MembershipStatus = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count
    const countSql = `SELECT COUNT(*) AS total FROM Member m ${whereClause}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // Data query with aggregated active borrowings, overdue counts, and outstanding fines
    const dataSql = `
      SELECT 
        m.MemberID,
        m.Name,
        m.Email,
        m.ContactNo,
        m.MembershipStatus,
        m.JoinDate,
        m.Address,
        m.CreatedAt,
        COALESCE(loan_stats.ActiveLoans, 0) AS ActiveLoans,
        COALESCE(loan_stats.OverdueLoans, 0) AS OverdueLoans,
        COALESCE(loan_stats.TotalUnpaidFines, 0.00) AS TotalUnpaidFines
      FROM Member m
      LEFT JOIN (
        SELECT 
          MemberID,
          SUM(CASE WHEN Status = 'Issued' THEN 1 ELSE 0 END) AS ActiveLoans,
          SUM(CASE WHEN Status = 'Issued' AND CURDATE() > DueDate THEN 1 ELSE 0 END) AS OverdueLoans,
          SUM(FineAmount - FinePaidAmount) AS TotalUnpaidFines
        FROM BookIssued
        GROUP BY MemberID
      ) loan_stats ON m.MemberID = loan_stats.MemberID
      ${whereClause}
      ORDER BY m.${sortBy === 'JoinDate' ? 'JoinDate' : 'Name'} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limit, offset]);

    res.json(formatPaginatedResponse(rows, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// GET /api/members/:id
async function getMemberById(req, res, next) {
  try {
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid Member ID' });
    }

    const [members] = await pool.query(
      `SELECT 
        m.MemberID,
        m.Name,
        m.Email,
        m.ContactNo,
        m.MembershipStatus,
        m.JoinDate,
        m.Address,
        m.CreatedAt
      FROM Member m
      WHERE m.MemberID = ?`,
      [memberId]
    );

    if (members.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Current active loans
    const [activeLoans] = await pool.query(
      `SELECT 
        bi.IssueID,
        bi.ISBN,
        b.Title,
        b.AuthorName,
        bi.IssueDate,
        bi.DueDate,
        DATEDIFF(CURDATE(), bi.DueDate) AS DaysOverdue,
        CASE 
          WHEN CURDATE() > bi.DueDate THEN 'Overdue'
          ELSE 'Normal'
        END AS LoanStatus,
        s.Name AS IssuedByStaff
      FROM BookIssued bi
      INNER JOIN Books b ON bi.ISBN = b.ISBN
      INNER JOIN Staff s ON bi.IssuedBy = s.StaffID
      WHERE bi.MemberID = ? AND bi.Status = 'Issued'
      ORDER BY bi.DueDate ASC`,
      [memberId]
    );

    // Outstanding fines
    const [outstandingFines] = await pool.query(
      `SELECT 
        bi.IssueID,
        b.Title,
        bi.DueDate,
        bi.ReturnDate,
        bi.FineAmount,
        bi.FinePaidAmount,
        (bi.FineAmount - bi.FinePaidAmount) AS OutstandingBalance
      FROM BookIssued bi
      INNER JOIN Books b ON bi.ISBN = b.ISBN
      WHERE bi.MemberID = ? AND (bi.FineAmount - bi.FinePaidAmount) > 0
      ORDER BY bi.IssueID DESC`,
      [memberId]
    );

    // Complete borrowing history via stored procedure
    const [historyResult] = await pool.query('CALL sp_GetMemberBorrowingHistory(?)', [memberId]);
    const history = historyResult[0] || [];

    // Payment receipts
    const [receipts] = await pool.query(
      `SELECT 
        r.ReceiptID,
        r.TransactionID,
        r.TransactionType,
        r.Amount,
        r.PaymentMethod,
        r.PaymentStatus,
        r.TransactionDateTime,
        s.Name AS StaffName
      FROM Receipt r
      INNER JOIN Staff s ON r.StaffID = s.StaffID
      WHERE r.MemberID = ?
      ORDER BY r.TransactionDateTime DESC`,
      [memberId]
    );

    res.json({
      success: true,
      data: {
        ...members[0],
        activeLoans,
        outstandingFines,
        borrowingHistory: history,
        receipts
      }
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/members
async function createMember(req, res, next) {
  try {
    const { Name, Email, ContactNo, Address, MembershipStatus, JoinDate } = req.body;

    if (!Name || !Email || !ContactNo) {
      return res.status(400).json({
        success: false,
        message: 'Name, Email, and Contact Number are mandatory fields.'
      });
    }

    const joinDateValue = JoinDate || new Date().toISOString().split('T')[0];
    const statusValue = MembershipStatus && ['Active', 'Suspended', 'Inactive'].includes(MembershipStatus)
      ? MembershipStatus
      : 'Active';

    const [result] = await pool.query(
      `INSERT INTO Member (Name, Email, ContactNo, MembershipStatus, JoinDate, Address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Name.trim(),
        Email.trim(),
        ContactNo.trim(),
        statusValue,
        joinDateValue,
        Address ? Address.trim() : null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: {
        MemberID: result.insertId,
        Name: Name.trim(),
        Email: Email.trim(),
        MembershipStatus: statusValue
      }
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/members/:id
async function updateMember(req, res, next) {
  try {
    const memberId = parseInt(req.params.id, 10);
    const { Name, Email, ContactNo, Address, MembershipStatus } = req.body;

    if (isNaN(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid Member ID' });
    }

    const [result] = await pool.query(
      `UPDATE Member 
       SET 
         Name = COALESCE(?, Name),
         Email = COALESCE(?, Email),
         ContactNo = COALESCE(?, ContactNo),
         Address = COALESCE(?, Address),
         MembershipStatus = COALESCE(?, MembershipStatus)
       WHERE MemberID = ?`,
      [
        Name !== undefined ? Name.trim() : null,
        Email !== undefined ? Email.trim() : null,
        ContactNo !== undefined ? ContactNo.trim() : null,
        Address !== undefined ? Address.trim() : null,
        MembershipStatus !== undefined ? MembershipStatus : null,
        memberId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({
      success: true,
      message: 'Member information updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/members/:id/status
async function updateMemberStatus(req, res, next) {
  try {
    const memberId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid Member ID' });
    }

    if (!['Active', 'Suspended', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Active', 'Suspended', or 'Inactive'."
      });
    }

    const [result] = await pool.query(
      'UPDATE Member SET MembershipStatus = ? WHERE MemberID = ?',
      [status, memberId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    res.json({
      success: true,
      message: `Member status successfully updated to ${status}`
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/members/:id/history
async function getMemberHistory(req, res, next) {
  try {
    const memberId = parseInt(req.params.id, 10);
    if (isNaN(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid Member ID' });
    }

    const [historyResult] = await pool.query('CALL sp_GetMemberBorrowingHistory(?)', [memberId]);
    res.json({
      success: true,
      data: historyResult[0] || []
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  updateMemberStatus,
  getMemberHistory
};
