const express = require('express');
const router = express.Router();
const membersController = require('../controllers/membersController');

router.get('/', membersController.getAllMembers);
router.get('/:id', membersController.getMemberById);
router.post('/', membersController.createMember);
router.put('/:id', membersController.updateMember);
router.patch('/:id/status', membersController.updateMemberStatus);
router.get('/:id/history', membersController.getMemberHistory);

module.exports = router;
