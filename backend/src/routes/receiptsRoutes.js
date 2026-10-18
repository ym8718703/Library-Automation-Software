const express = require('express');
const router = express.Router();
const receiptsController = require('../controllers/receiptsController');

router.get('/', receiptsController.getAllReceipts);
router.get('/:id', receiptsController.getReceiptById);
router.post('/fine-payment', receiptsController.recordFinePayment);
router.post('/fee', receiptsController.createFeeReceipt);

module.exports = router;
