const express = require('express');
const router = express.Router();
const publishersController = require('../controllers/publishersController');

router.get('/', publishersController.getAllPublishers);
router.get('/:id', publishersController.getPublisherById);
router.post('/', publishersController.createPublisher);
router.put('/:id', publishersController.updatePublisher);
router.delete('/:id', publishersController.deletePublisher);

module.exports = router;
