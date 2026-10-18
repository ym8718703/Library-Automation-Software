// Global error handling middleware for Express
function errorHandler(err, req, res, next) {
  console.error('[API Error]', {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    code: err.code,
    sqlMessage: err.sqlMessage
  });

  // MySQL specific error codes
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate Entry',
      message: err.sqlMessage || 'A record with this identifier or unique field already exists.'
    });
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return res.status(409).json({
      success: false,
      error: 'Referential Integrity Violation',
      message: 'Cannot delete or modify record because other records depend on it.'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({
      success: false,
      error: 'Foreign Key Violation',
      message: 'The referenced foreign entity (e.g. Publisher, Member, Staff, or Book) does not exist.'
    });
  }

  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return res.status(400).json({
      success: false,
      error: 'Check Constraint Violated',
      message: err.sqlMessage || 'Invalid data value according to database check constraint.'
    });
  }

  // Stored procedure custom signals (SQLSTATE 45000)
  if (err.sqlState === '45000') {
    return res.status(400).json({
      success: false,
      error: 'Business Rule Violation',
      message: err.sqlMessage || 'Database validation rule failed.'
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected server error occurred.'
  });
}

module.exports = {
  errorHandler
};
