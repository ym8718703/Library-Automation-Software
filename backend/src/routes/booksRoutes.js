const express = require('express');
const router = express.Router();
const booksController = require('../controllers/booksController');

router.get('/', booksController.getAllBooks);
router.get('/:isbn', booksController.getBookByISBN);
router.post('/', booksController.createBook);
router.put('/:isbn', booksController.updateBook);
router.delete('/:isbn', booksController.deleteBook);

module.exports = router;
