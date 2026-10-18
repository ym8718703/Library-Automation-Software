const express = require('express');
const router = express.Router();
const explorerController = require('../controllers/databaseExplorerController');

router.get('/tables', explorerController.getTablesOverview);
router.get('/queries', explorerController.getPredefinedQueries);
router.post('/run-query', explorerController.runPredefinedQuery);
router.get('/objects', explorerController.getDatabaseObjects);

module.exports = router;
