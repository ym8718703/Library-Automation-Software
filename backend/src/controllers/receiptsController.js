const { pool } = require('../config/database');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/helpers');

// Helper to generate unique transaction ID
function generateTransactionId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TXN-${dateStr}-${randomSuffix}`;
}

// GET /api/receipts
async function getAllReceipts(req, res, next) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    const memberId = req.query.memberId ? parseInt(req.query.memberId, 10) : null;
    const staffId = req.query.staffId ? parseInt(req.query.staffId, 10) : null;
    const paymentMethod = req.query.paymentMethod;
    const transactionType = req.query.transactionType;
    const paymentStatus = req.query.paymentStatus;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(r.TransactionID LIKE ? OR m.Name LIKE ? OR CAST(r.ReceiptID AS CHAR) LIKE ?)');
      params.push(search, search, search);
    }

    if (memberId && !isNaN(memberId)) {
      conditions.push('r.MemberID = ?');
      params.push(memberId);
    }

    if (staffId && !isNaN(staffId)) {
      conditions.push('r.StaffID = ?');
      params.push(staffId);
    }

    if (paymentMethod && ['Cash', 'UPI', 'Card', 'Other'].includes(paymentMethod)) {
      conditions.push('r.PaymentMethod = ?');
      params.push(paymentMethod);
    }

    if (transactionType && ['Fine Payment', 'Other Fee', 'Refund'].includes(transactionType)) {
      conditions.push('r.TransactionType = ?');
      params.push(transactionType);
    }

    if (paymentStatus && ['Completed', 'Pending', 'Cancelled'].includes(paymentStatus)) {
      conditions.push('r.PaymentStatus = ?');
      params.push(paymentStatus);
    }

    if (startDate) {
      conditions.push('DATE(r.TransactionDateTime) >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('DATE(r.TransactionDateTime) <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) AS total 
      FROM Receipt r
      INNER JOIN Member m ON r.MemberID = m.MemberID
      INNER JOIN Staff s ON r.StaffID = s.StaffID
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // Use view vw_ReceiptDetails
    const dataSql = `
      SELECT 
        r.ReceiptID,
        r.TransactionID,
        r.MemberID,
        m.Name AS MemberName,
        m.Email AS MemberEmail,
        r.StaffID,
        s.Name AS StaffName,
        r.IssueID,
        b.Title AS BookTitle,
        b.ISBN,
        r.TransactionType,
        r.Amount,
        r.PaymentMethod,
        r.PaymentStatus,
        r.TransactionDateTime,
        r.Remarks
      FROM Receipt r
      INNER JOIN Member m ON r.MemberID = m.MemberID
      INNER JOIN Staff s ON r.StaffID = s.StaffID
      LEFT JOIN BookIssued bi ON r.IssueID = bi.IssueID
      LEFT JOIN Books b ON bi.ISBN = b.ISBN
      ${whereClause}
      ORDER BY r.TransactionDateTime DESC, r.ReceiptID DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limit, offset]);

    res.json(formatPaginatedResponse(rows, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// GET /api/receipts/:id
async function getReceiptById(req, res, next) {
  try {
    const receiptId = parseInt(req.params.id, 10);
    if (isNaN(receiptId)) {
      return res.status(400).json({ success: false, message: 'Invalid Receipt ID' });
    }

    // Retrieve library metadata
    const [settings] = await pool.query('SELECT SettingKey, SettingValue FROM Settings');
    const settingsMap = {};
    settings.forEach(row => { settingsMap[row.SettingKey] = row.SettingValue; });

    const [rows] = await pool.query(
      `SELECT 
        r.ReceiptID,
        r.TransactionID,
        r.MemberID,
        m.Name AS MemberName,
        m.Email AS MemberEmail,
        m.ContactNo AS MemberContact,
        r.StaffID,
        s.Name AS StaffName,
        s.Post AS StaffPost,
        r.IssueID,
        bi.IssueDate,
        bi.DueDate,
        bi.ReturnDate,
        b.Title AS BookTitle,
        b.ISBN,
        r.TransactionType,
        r.Amount,
        r.PaymentMethod,
        r.PaymentStatus,
        r.TransactionDateTime,
        r.Remarks
      FROM Receipt r
      INNER JOIN Member m ON r.MemberID = m.MemberID
      INNER JOIN Staff s ON r.StaffID = s.StaffID
      LEFT JOIN BookIssued bi ON r.IssueID = bi.IssueID
      LEFT JOIN Books b ON bi.ISBN = b.ISBN
      WHERE r.ReceiptID = ?`,
      [receiptId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    res.json({
      success: true,
      data: {
        ...rows[0],
        libraryName: settingsMap.library_name || 'College Library Management System',
        libraryEmail: settingsMap.contact_email || 'library@college.edu'
      }
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/payments/fines (Process fine payment atomically)
async function recordFinePayment(req, res, next) {
  try {
    const { IssueID, MemberID, StaffID, Amount, PaymentMethod, Remarks } = req.body;

    if (!IssueID || !MemberID || !StaffID || !Amount || !PaymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'IssueID, MemberID, StaffID, Amount, and PaymentMethod are required.'
      });
    }

    const numAmount = parseFloat(Amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be a positive number.'
      });
    }

    const transactionId = generateTransactionId();

    // Call stored procedure sp_RecordFinePayment
    const [resultSets] = await pool.query(`
      CALL sp_RecordFinePayment(?, ?, ?, ?, ?, ?, ?, @p_ReceiptID, @p_NewBalance, @p_StatusMessage);
      SELECT @p_ReceiptID AS ReceiptID, @p_NewBalance AS NewBalance, @p_StatusMessage AS StatusMessage;
    `, [
      parseInt(IssueID, 10),
      parseInt(MemberID, 10),
      parseInt(StaffID, 10),
      numAmount,
      PaymentMethod,
      transactionId,
      Remarks || 'Fine payment recorded'
    ]);

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
      message: `Fine payment of ₹${numAmount.toFixed(2)} recorded successfully.`,
      data: {
        ReceiptID: spOutput.ReceiptID,
        TransactionID: transactionId,
        AmountPaid: numAmount,
        RemainingBalance: parseFloat(spOutput.NewBalance) || 0
      }
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/receipts/fee (Record other fees like registration, card replacement)
async function createFeeReceipt(req, res, next) {
  try {
    const { MemberID, StaffID, TransactionType, Amount, PaymentMethod, Remarks } = req.body;

    if (!MemberID || !StaffID || !TransactionType || !Amount || !PaymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'MemberID, StaffID, TransactionType, Amount, and PaymentMethod are required.'
      });
    }

    const numAmount = parseFloat(Amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });
    }

    const transactionId = generateTransactionId();

    const [result] = await pool.query(
      `INSERT INTO Receipt 
        (TransactionID, MemberID, StaffID, IssueID, TransactionType, Amount, PaymentMethod, PaymentStatus, TransactionDateTime, Remarks)
       VALUES (?, ?, ?, NULL, ?, ?, ?, 'Completed', NOW(), ?)`,
      [
        transactionId,
        parseInt(MemberID, 10),
        parseInt(StaffID, 10),
        TransactionType,
        numAmount,
        PaymentMethod,
        Remarks || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Receipt recorded successfully',
      data: {
        ReceiptID: result.insertId,
        TransactionID: transactionId,
        Amount: numAmount
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllReceipts,
  getReceiptById,
  recordFinePayment,
  createFeeReceipt
};
