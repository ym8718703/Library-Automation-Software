const express = require('express');
const router = express.Router();
const issuesController = require('../controllers/issuesController');

router.get('/', issuesController.getAllIssues);
router.get('/overdue', issuesController.getOverdueIssues);
router.get('/fines', issuesController.getFines);
router.get('/:id', issuesController.getIssueById);
router.post('/', issuesController.issueBook);
router.post('/:id/return', issuesController.returnBook);

module.exports = router;
