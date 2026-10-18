const { pool } = require('../config/database');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/helpers');

// GET /api/publishers
async function getAllPublishers(req, res, next) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;

    let whereClause = '';
    const params = [];

    if (search) {
      whereClause = 'WHERE p.PublisherName LIKE ?';
      params.push(search);
    }

    // Total count query
    const countSql = `SELECT COUNT(*) AS total FROM Publisher p ${whereClause}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // Data query with book counts
    const dataSql = `
      SELECT 
        p.PublisherID,
        p.PublisherName,
        p.CreatedAt,
        COUNT(b.ISBN) AS BookCount,
        COALESCE(SUM(b.TotalCopies), 0) AS TotalCopies,
        COALESCE(SUM(b.AvailableCopies), 0) AS AvailableCopies
      FROM Publisher p
      LEFT JOIN Books b ON p.PublisherID = b.PublisherID
      ${whereClause}
      GROUP BY p.PublisherID, p.PublisherName, p.CreatedAt
      ORDER BY p.PublisherName ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limit, offset]);

    res.json(formatPaginatedResponse(rows, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// GET /api/publishers/:id
async function getPublisherById(req, res, next) {
  try {
    const publisherId = parseInt(req.params.id, 10);
    if (isNaN(publisherId)) {
      return res.status(400).json({ success: false, message: 'Invalid Publisher ID' });
    }

    const [publishers] = await pool.query(
      `SELECT p.PublisherID, p.PublisherName, p.CreatedAt 
       FROM Publisher p 
       WHERE p.PublisherID = ?`,
      [publisherId]
    );

    if (publishers.length === 0) {
      return res.status(404).json({ success: false, message: 'Publisher not found' });
    }

    // Also get books published by this publisher
    const [books] = await pool.query(
      `SELECT ISBN, Title, AuthorName, Price, TotalCopies, AvailableCopies, Edition 
       FROM Books 
       WHERE PublisherID = ? 
       ORDER BY Title ASC`,
      [publisherId]
    );

    res.json({
      success: true,
      data: {
        ...publishers[0],
        books
      }
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/publishers
async function createPublisher(req, res, next) {
  try {
    const { PublisherName } = req.body;
    if (!PublisherName || !PublisherName.trim()) {
      return res.status(400).json({ success: false, message: 'Publisher name is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO Publisher (PublisherName) VALUES (?)',
      [PublisherName.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Publisher created successfully',
      data: {
        PublisherID: result.insertId,
        PublisherName: PublisherName.trim()
      }
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/publishers/:id
async function updatePublisher(req, res, next) {
  try {
    const publisherId = parseInt(req.params.id, 10);
    const { PublisherName } = req.body;

    if (isNaN(publisherId)) {
      return res.status(400).json({ success: false, message: 'Invalid Publisher ID' });
    }
    if (!PublisherName || !PublisherName.trim()) {
      return res.status(400).json({ success: false, message: 'Publisher name is required' });
    }

    const [result] = await pool.query(
      'UPDATE Publisher SET PublisherName = ? WHERE PublisherID = ?',
      [PublisherName.trim(), publisherId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Publisher not found' });
    }

    res.json({
      success: true,
      message: 'Publisher updated successfully',
      data: {
        PublisherID: publisherId,
        PublisherName: PublisherName.trim()
      }
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/publishers/:id
async function deletePublisher(req, res, next) {
  try {
    const publisherId = parseInt(req.params.id, 10);
    if (isNaN(publisherId)) {
      return res.status(400).json({ success: false, message: 'Invalid Publisher ID' });
    }

    // Check if any books reference this publisher
    const [books] = await pool.query(
      'SELECT COUNT(*) AS count FROM Books WHERE PublisherID = ?',
      [publisherId]
    );

    if (books[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete publisher. There are ${books[0].count} book(s) referencing this publisher. Please reassign or remove them first.`
      });
    }

    const [result] = await pool.query('DELETE FROM Publisher WHERE PublisherID = ?', [publisherId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Publisher not found' });
    }

    res.json({
      success: true,
      message: 'Publisher deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllPublishers,
  getPublisherById,
  createPublisher,
  updatePublisher,
  deletePublisher
};
