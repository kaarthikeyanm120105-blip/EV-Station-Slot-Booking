const express = require('express');
const router = express.Router();
const {
    initiateBooking, confirmBooking, getUserBookings,
    getOwnerBookings, getOwnerEarnings, getAvailability
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/order', protect, authorize('user'), initiateBooking);
router.post('/verify', protect, authorize('user'), confirmBooking);
router.get('/user', protect, authorize('user'), getUserBookings);
router.get('/owner', protect, authorize('owner'), getOwnerBookings);
router.get('/owner/earnings', protect, authorize('owner'), getOwnerEarnings);
router.get('/availability', getAvailability);

// Owner Manual Charging APIs
const { startCharging, stopCharging, getPortStatus } = require('../controllers/bookingController');
router.post('/owner/start-charging', protect, authorize('owner'), startCharging);
router.post('/owner/stop-charging', protect, authorize('owner'), stopCharging);
router.get('/owner/station/:id/ports', protect, authorize('owner'), getPortStatus);

module.exports = router;
