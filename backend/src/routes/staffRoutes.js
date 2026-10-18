const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

router.get('/', staffController.getAllStaff);
router.get('/:id', staffController.getStaffById);
router.post('/', staffController.createStaff);
router.put('/:id', staffController.updateStaff);
router.patch('/:id/status', staffController.toggleStaffStatus);
router.get('/:id/activity', staffController.getStaffActivity);

module.exports = router;
