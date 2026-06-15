const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ChargingStation = require('../models/ChargingStation');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc   Get admin dashboard stats
// @route  GET /api/admin/stats
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalStations = await ChargingStation.countDocuments();
        const pendingStations = await ChargingStation.countDocuments({ isApproved: false });
        const totalBookings = await Booking.countDocuments();
        
        // "Online" users could defined as logged in within the last 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const onlineUsers = await User.countDocuments({ lastLogin: { $gte: fifteenMinutesAgo } });

        res.json({
            totalUsers,
            onlineUsers,
            totalStations,
            pendingStations,
            totalBookings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc   Get all users
// @route  GET /api/admin/users
router.get('/users', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
