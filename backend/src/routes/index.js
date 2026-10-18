const express = require('express');
const router = express.Router();

const booksRoutes = require('./booksRoutes');
const publishersRoutes = require('./publishersRoutes');
const membersRoutes = require('./membersRoutes');
const staffRoutes = require('./staffRoutes');
const issuesRoutes = require('./issuesRoutes');
const receiptsRoutes = require('./receiptsRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportsRoutes = require('./reportsRoutes');
const explorerRoutes = require('./databaseExplorerRoutes');
const settingsRoutes = require('./settingsRoutes');

// Mount routes
router.use('/books', booksRoutes);
router.use('/publishers', publishersRoutes);
router.use('/members', membersRoutes);
router.use('/staff', staffRoutes);
router.use('/issues', issuesRoutes);
router.use('/receipts', receiptsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);
router.use('/explorer', explorerRoutes);
router.use('/settings', settingsRoutes);

// Direct alias for fine payments matching prompt specifications
const receiptsController = require('../controllers/receiptsController');
router.post('/payments/fines', receiptsController.recordFinePayment);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Library Management System API',
    database: 'MySQL 8.0 (InnoDB)'
  });
});

module.exports = router;
