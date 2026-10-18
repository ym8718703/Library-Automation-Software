const { pool } = require('../config/database');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/helpers');

// GET /api/staff
async function getAllStaff(req, res, next) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    const active = req.query.active !== undefined ? (req.query.active === 'true' || req.query.active === '1') : null;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(s.Name LIKE ? OR s.Email LIKE ? OR s.Post LIKE ?)');
      params.push(search, search, search);
    }

    if (active !== null) {
      conditions.push('s.IsActive = ?');
      params.push(active);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) AS total FROM Staff s ${whereClause}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // Use view vw_StaffActivity to get accurate metrics without join explosion
    const dataSql = `
      SELECT 
        sa.StaffID,
        sa.StaffName AS Name,
        sa.Post,
        sa.Email,
        sa.IsActive,
        sa.TotalBooksIssued,
        sa.TotalBooksReturned,
        sa.TotalReceiptsProcessed,
        sa.TotalAmountCollected,
        s.ContactNo,
        s.Role,
        s.CreatedAt
      FROM vw_StaffActivity sa
      INNER JOIN Staff s ON sa.StaffID = s.StaffID
      ${whereClause}
      ORDER BY s.Name ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limit, offset]);

    res.json(formatPaginatedResponse(rows, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// GET /api/staff/:id
async function getStaffById(req, res, next) {
  try {
    const staffId = parseInt(req.params.id, 10);
    if (isNaN(staffId)) {
      return res.status(400).json({ success: false, message: 'Invalid Staff ID' });
    }

    const [staffRows] = await pool.query(
      `SELECT 
        s.StaffID,
        s.Name,
        s.Post,
        s.Email,
        s.ContactNo,
        s.Role,
        s.IsActive,
        s.CreatedAt,
        sa.TotalBooksIssued,
        sa.TotalBooksReturned,
        sa.TotalReceiptsProcessed,
        sa.TotalAmountCollected
      FROM Staff s
      LEFT JOIN vw_StaffActivity sa ON s.StaffID = sa.StaffID
      WHERE s.StaffID = ?`,
      [staffId]
    );

    if (staffRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Recent books issued by this staff
    const [recentIssues] = await pool.query(
      `SELECT 
        bi.IssueID,
        b.Title,
        m.Name AS MemberName,
        bi.IssueDate,
        bi.DueDate,
        bi.Status
      FROM BookIssued bi
      INNER JOIN Books b ON bi.ISBN = b.ISBN
      INNER JOIN Member m ON bi.MemberID = m.MemberID
      WHERE bi.IssuedBy = ?
      ORDER BY bi.IssueDate DESC
      LIMIT 10`,
      [staffId]
    );

    // Recent receipts processed by this staff
    const [recentReceipts] = await pool.query(
      `SELECT 
        r.ReceiptID,
        r.TransactionID,
        m.Name AS MemberName,
        r.TransactionType,
        r.Amount,
        r.PaymentMethod,
        r.TransactionDateTime
      FROM Receipt r
      INNER JOIN Member m ON r.MemberID = m.MemberID
      WHERE r.StaffID = ?
      ORDER BY r.TransactionDateTime DESC
      LIMIT 10`,
      [staffId]
    );

    res.json({
      success: true,
      data: {
        ...staffRows[0],
        recentIssues,
        recentReceipts
      }
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/staff
async function createStaff(req, res, next) {
  try {
    const { Name, Post, Email, ContactNo, Role } = req.body;

    if (!Name || !Post || !Email || !ContactNo) {
      return res.status(400).json({
        success: false,
        message: 'Name, Post, Email, and Contact Number are mandatory fields.'
      });
    }

    const roleValue = Role && ['Admin', 'Librarian', 'Staff'].includes(Role) ? Role : 'Librarian';

    const [result] = await pool.query(
      `INSERT INTO Staff (Name, Post, Email, ContactNo, Role, IsActive)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [Name.trim(), Post.trim(), Email.trim(), ContactNo.trim(), roleValue]
    );

    res.status(201).json({
      success: true,
      message: 'Staff member added successfully',
      data: {
        StaffID: result.insertId,
        Name: Name.trim(),
        Post: Post.trim(),
        Email: Email.trim(),
        Role: roleValue
      }
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/staff/:id
async function updateStaff(req, res, next) {
  try {
    const staffId = parseInt(req.params.id, 10);
    const { Name, Post, Email, ContactNo, Role } = req.body;

    if (isNaN(staffId)) {
      return res.status(400).json({ success: false, message: 'Invalid Staff ID' });
    }

    const [result] = await pool.query(
      `UPDATE Staff 
       SET 
         Name = COALESCE(?, Name),
         Post = COALESCE(?, Post),
         Email = COALESCE(?, Email),
         ContactNo = COALESCE(?, ContactNo),
         Role = COALESCE(?, Role)
       WHERE StaffID = ?`,
      [
        Name !== undefined ? Name.trim() : null,
        Post !== undefined ? Post.trim() : null,
        Email !== undefined ? Email.trim() : null,
        ContactNo !== undefined ? ContactNo.trim() : null,
        Role !== undefined ? Role : null,
        staffId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.json({
      success: true,
      message: 'Staff details updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/staff/:id/status
async function toggleStaffStatus(req, res, next) {
  try {
    const staffId = parseInt(req.params.id, 10);
    const { isActive } = req.body;

    if (isNaN(staffId)) {
      return res.status(400).json({ success: false, message: 'Invalid Staff ID' });
    }

    const newStatus = Boolean(isActive);

    const [result] = await pool.query(
      'UPDATE Staff SET IsActive = ? WHERE StaffID = ?',
      [newStatus, staffId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.json({
      success: true,
      message: `Staff member is now ${newStatus ? 'Active' : 'Inactive'}`
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/staff/:id/activity
async function getStaffActivity(req, res, next) {
  try {
    const staffId = parseInt(req.params.id, 10);
    if (isNaN(staffId)) {
      return res.status(400).json({ success: false, message: 'Invalid Staff ID' });
    }

    const [activityRows] = await pool.query(
      'SELECT * FROM vw_StaffActivity WHERE StaffID = ?',
      [staffId]
    );

    if (activityRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.json({
      success: true,
      data: activityRows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  getStaffActivity
};
