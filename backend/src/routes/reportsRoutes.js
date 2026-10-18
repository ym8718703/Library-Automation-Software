const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

router.get('/inventory', reportsController.getInventoryReport);
router.get('/available', reportsController.getAvailableBooksReport);
router.get('/current-issues', reportsController.getCurrentIssuesReport);
router.get('/overdue', reportsController.getOverdueReport);
router.get('/member-borrowing', reportsController.getMemberBorrowingReport);
router.get('/staff-activity', reportsController.getStaffActivityReport);
router.get('/publisher-inventory', reportsController.getPublisherInventoryReport);
router.get('/fine-collection', reportsController.getFineCollectionReport);
router.get('/popular-books', reportsController.getPopularBooksReport);

module.exports = router;
