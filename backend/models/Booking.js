const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Optional for offline users
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'ChargingStation', required: true },
    bookingDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: false }, // Optional for active sessions
    totalAmount: { type: Number, required: false, default: 0 },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'offline_paid'], default: 'pending' },
    bookingStatus: { type: String, enum: ['upcoming', 'active', 'completed', 'cancelled'], default: 'upcoming' },
    source: { type: String, enum: ['online', 'offline'], default: 'online' },
    portNumber: { type: Number },
    razorpayOrderId: { type: String },
    transactionId: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);
