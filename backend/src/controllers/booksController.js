const { pool } = require('../config/database');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/helpers');

// GET /api/books
async function getAllBooks(req, res, next) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    const publisherId = req.query.publisherId ? parseInt(req.query.publisherId, 10) : null;
    const availability = req.query.availability; // 'in-stock', 'out-of-stock', 'all'
    const sortBy = req.query.sortBy || 'Title';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    // Whitelist valid sort columns
    const allowedSortColumns = {
      'Title': 'b.Title',
      'AuthorName': 'b.AuthorName',
      'Price': 'b.Price',
      'AvailableCopies': 'b.AvailableCopies',
      'TotalCopies': 'b.TotalCopies',
      'PublisherName': 'p.PublisherName'
    };
    const orderColumn = allowedSortColumns[sortBy] || 'b.Title';

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(b.Title LIKE ? OR b.AuthorName LIKE ? OR b.ISBN LIKE ? OR p.PublisherName LIKE ?)');
      params.push(search, search, search, search);
    }

    if (publisherId && !isNaN(publisherId)) {
      conditions.push('b.PublisherID = ?');
      params.push(publisherId);
    }

    if (availability === 'in-stock') {
      conditions.push('b.AvailableCopies > 0');
    } else if (availability === 'out-of-stock') {
      conditions.push('b.AvailableCopies = 0');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countSql = `
      SELECT COUNT(*) AS total 
      FROM Books b 
      INNER JOIN Publisher p ON b.PublisherID = p.PublisherID 
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // Data query using SQL JOIN with Publisher
    const dataSql = `
      SELECT 
        b.ISBN,
        b.Title,
        b.AuthorName,
        b.PublisherID,
        p.PublisherName,
        b.Price,
        b.NoOfPages,
        b.Edition,
        b.TotalCopies,
        b.AvailableCopies,
        (b.TotalCopies - b.AvailableCopies) AS BorrowedCopies,
        CASE 
          WHEN b.AvailableCopies > 0 THEN 'In Stock'
          ELSE 'Out of Stock'
        END AS AvailabilityStatus,
        b.CreatedAt,
        b.UpdatedAt
      FROM Books b
      INNER JOIN Publisher p ON b.PublisherID = p.PublisherID
      ${whereClause}
      ORDER BY ${orderColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limit, offset]);

    res.json(formatPaginatedResponse(rows, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// GET /api/books/:isbn
async function getBookByISBN(req, res, next) {
  try {
    const { isbn } = req.params;

    const [books] = await pool.query(
      `SELECT 
        b.ISBN,
        b.Title,
        b.AuthorName,
        b.PublisherID,
        p.PublisherName,
        b.Price,
        b.NoOfPages,
        b.Edition,
        b.TotalCopies,
        b.AvailableCopies,
        (b.TotalCopies - b.AvailableCopies) AS BorrowedCopies,
        b.CreatedAt,
        b.UpdatedAt
      FROM Books b
      INNER JOIN Publisher p ON b.PublisherID = p.PublisherID
      WHERE b.ISBN = ?`,
      [isbn]
    );

    if (books.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Retrieve active and recent borrowing history
    const [history] = await pool.query(
      `SELECT 
        bi.IssueID,
        bi.MemberID,
        m.Name AS MemberName,
        m.Email AS MemberEmail,
        bi.IssueDate,
        bi.DueDate,
        bi.ReturnDate,
        bi.Status,
        bi.FineAmount,
        bi.FinePaidAmount,
        s.Name AS IssuedByStaff
      FROM BookIssued bi
      INNER JOIN Member m ON bi.MemberID = m.MemberID
      INNER JOIN Staff s ON bi.IssuedBy = s.StaffID
      WHERE bi.ISBN = ?
      ORDER BY bi.IssueDate DESC, bi.IssueID DESC
      LIMIT 20`,
      [isbn]
    );

    res.json({
      success: true,
      data: {
        ...books[0],
        borrowingHistory: history
      }
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/books
async function createBook(req, res, next) {
  try {
    const {
      ISBN,
      Title,
      AuthorName,
      PublisherID,
      Price,
      NoOfPages,
      Edition,
      TotalCopies
    } = req.body;

    // Validation
    if (!ISBN || !Title || !AuthorName || !PublisherID) {
      return res.status(400).json({
        success: false,
        message: 'ISBN, Title, AuthorName, and PublisherID are mandatory fields.'
      });
    }

    const numPrice = parseFloat(Price);
    const numTotal = parseInt(TotalCopies, 10) || 0;
    const numPages = NoOfPages ? parseInt(NoOfPages, 10) : null;

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a non-negative number.' });
    }
    if (numTotal < 0) {
      return res.status(400).json({ success: false, message: 'TotalCopies cannot be negative.' });
    }

    // Verify publisher exists
    const [pub] = await pool.query('SELECT PublisherID FROM Publisher WHERE PublisherID = ?', [PublisherID]);
    if (pub.length === 0) {
      return res.status(400).json({ success: false, message: 'Specified Publisher does not exist.' });
    }

    // For new books, AvailableCopies equals TotalCopies
    const availableCopies = numTotal;

    await pool.query(
      `INSERT INTO Books 
        (ISBN, Title, AuthorName, PublisherID, Price, NoOfPages, Edition, TotalCopies, AvailableCopies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ISBN.trim(),
        Title.trim(),
        AuthorName.trim(),
        PublisherID,
        numPrice,
        numPages,
        Edition ? Edition.trim() : null,
        numTotal,
        availableCopies
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Book added to catalog successfully',
      data: {
        ISBN: ISBN.trim(),
        Title: Title.trim(),
        AuthorName: AuthorName.trim(),
        PublisherID,
        Price: numPrice,
        TotalCopies: numTotal,
        AvailableCopies: availableCopies
      }
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/books/:isbn
async function updateBook(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { isbn } = req.params;
    const {
      Title,
      AuthorName,
      PublisherID,
      Price,
      NoOfPages,
      Edition,
      TotalCopies
    } = req.body;

    await connection.beginTransaction();

    // Lock the book row FOR UPDATE
    const [existing] = await connection.query(
      'SELECT ISBN, TotalCopies, AvailableCopies FROM Books WHERE ISBN = ? FOR UPDATE',
      [isbn]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const currentBook = existing[0];
    const newTotal = TotalCopies !== undefined ? parseInt(TotalCopies, 10) : currentBook.TotalCopies;
    const currentlyBorrowed = currentBook.TotalCopies - currentBook.AvailableCopies;

    if (newTotal < currentlyBorrowed) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot reduce TotalCopies to ${newTotal}. There are currently ${currentlyBorrowed} copies issued to members.`
      });
    }

    const newAvailable = newTotal - currentlyBorrowed;
    const numPrice = Price !== undefined ? parseFloat(Price) : undefined;
    const numPages = NoOfPages !== undefined ? (NoOfPages ? parseInt(NoOfPages, 10) : null) : undefined;

    await connection.query(
      `UPDATE Books 
       SET 
         Title = COALESCE(?, Title),
         AuthorName = COALESCE(?, AuthorName),
         PublisherID = COALESCE(?, PublisherID),
         Price = COALESCE(?, Price),
         NoOfPages = COALESCE(?, NoOfPages),
         Edition = COALESCE(?, Edition),
         TotalCopies = ?,
         AvailableCopies = ?
       WHERE ISBN = ?`,
      [
        Title !== undefined ? Title.trim() : null,
        AuthorName !== undefined ? AuthorName.trim() : null,
        PublisherID !== undefined ? PublisherID : null,
        numPrice !== undefined ? numPrice : null,
        numPages,
        Edition !== undefined ? (Edition ? Edition.trim() : null) : null,
        newTotal,
        newAvailable,
        isbn
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Book details updated successfully',
      data: {
        ISBN: isbn,
        TotalCopies: newTotal,
        AvailableCopies: newAvailable
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

// DELETE /api/books/:isbn
async function deleteBook(req, res, next) {
  try {
    const { isbn } = req.params;

    // Check if any borrowing records exist (active or historical)
    const [issues] = await pool.query(
      'SELECT COUNT(*) AS total, SUM(CASE WHEN Status = "Issued" THEN 1 ELSE 0 END) AS activeLoans FROM BookIssued WHERE ISBN = ?',
      [isbn]
    );

    if (issues[0].activeLoans > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete book. There are ${issues[0].activeLoans} copy/copies currently issued to members.`
      });
    }

    if (issues[0].total > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete book. Historical borrowing transactions (${issues[0].total} record(s)) reference this ISBN. Deletion is restricted to preserve audit integrity.`
      });
    }

    const [result] = await pool.query('DELETE FROM Books WHERE ISBN = ?', [isbn]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({
      success: true,
      message: 'Book removed from catalog successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllBooks,
  getBookByISBN,
  createBook,
  updateBook,
  deleteBook
};
