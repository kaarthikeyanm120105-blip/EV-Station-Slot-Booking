const Booking = require('../models/Booking');
const ChargingStation = require('../models/ChargingStation');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
});

// Helper: parse "HH:MM" time string to minutes
const timeToMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
};

// Helper: check if two time intervals overlap
// [s1, e1] and [s2, e2]
const isOverlapping = (s1, e1, s2, e2) => {
    const start1 = timeToMinutes(s1);
    const end1 = timeToMinutes(e1);
    const start2 = timeToMinutes(s2);
    const end2 = timeToMinutes(e2);
    return Math.max(start1, start2) < Math.min(end1, end2);
};

// @desc   Calculate and initiate Razorpay order
// @route  POST /api/bookings/order
const initiateBooking = async (req, res) => {
    try {
        const { stationId, bookingDate, startTime, endTime } = req.body;

        const station = await ChargingStation.findById(stationId);
        if (!station) return res.status(404).json({ message: 'Station not found' });

        const now = new Date();
        const bookingDateObj = new Date(bookingDate);

        // 1. PREVENT PAST BOOKINGS
        if (bookingDateObj.toDateString() === now.toDateString()) {
            const [nowH, nowM] = [now.getHours(), now.getMinutes()];
            const [startH, startM] = startTime.split(':').map(Number);
            
            if (startH < nowH || (startH === nowH && startM <= nowM)) {
                return res.status(400).json({ message: 'Cannot book a slot in the past. Please select a future time.' });
            }
        } else if (bookingDateObj < now && bookingDateObj.toDateString() !== now.toDateString()) {
            return res.status(400).json({ message: 'Cannot book for a past date.' });
        }

        // 2. LIVE PORT & AVAILABILITY CHECK
        const bookingsOnDate = await Booking.find({
            station: stationId,
            bookingDate: {
                $gte: new Date(bookingDateObj.setHours(0,0,0,0)),
                $lte: new Date(bookingDateObj.setHours(23,59,59,999))
            },
            bookingStatus: { $in: ['upcoming', 'active', 'completed'] }
        });

        // Filter for overlaps
        const overlappingBookings = bookingsOnDate.filter(b => 
            isOverlapping(startTime, endTime, b.startTime, b.endTime || '23:59')
        );

        if (overlappingBookings.length >= station.totalPorts) {
            return res.status(400).json({ message: 'All ports are reserved or occupied for this time range. Please select another timing.' });
        }

        // Calculate amount
        const startMin = timeToMinutes(startTime);
        const endMin = timeToMinutes(endTime);
        const hours = (endMin - startMin) / 60;
        const totalAmount = Math.max(0, hours * station.pricePerHour);

        // Create Razorpay Order
        const options = {
            amount: totalAmount * 100, // amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        res.json({
            orderId: order.id,
            totalAmount,
            stationName: station.stationName,
            bookingDetails: {
                stationId,
                bookingDate,
                startTime,
                endTime
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Verify payment and create booking
// @route  POST /api/bookings/verify
const confirmBooking = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingDetails
        } = req.body;

        // Verify Signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ message: "Invalid payment signature" });
        }

        // Create Booking
        const booking = await Booking.create({
            user: req.user._id,
            station: bookingDetails.stationId,
            bookingDate: new Date(bookingDetails.bookingDate),
            startTime: bookingDetails.startTime,
            endTime: bookingDetails.endTime,
            totalAmount: req.body.amount / 100,
            paymentStatus: 'paid',
            bookingStatus: 'upcoming',
            razorpayOrderId: razorpay_order_id,
            transactionId: razorpay_payment_id
        });

        res.status(201).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get user bookings
// @route  GET /api/bookings/user
const getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('station', 'stationName city location address')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get owner's station bookings
// @route  GET /api/bookings/owner
const getOwnerBookings = async (req, res) => {
    try {
        const ownerStations = await ChargingStation.find({ owner: req.user._id }).select('_id');
        const stationIds = ownerStations.map((s) => s._id);
        const bookings = await Booking.find({ station: { $in: stationIds } })
            .populate('user', 'name email phone')
            .populate('station', 'stationName city location')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get earnings summary for owner
// @route  GET /api/bookings/owner/earnings
const getOwnerEarnings = async (req, res) => {
    try {
        const ownerStations = await ChargingStation.find({ owner: req.user._id }).select('_id stationName');
        const stationIds = ownerStations.map((s) => s._id);
        const bookings = await Booking.find({ station: { $in: stationIds }, paymentStatus: 'paid' }).populate('station', 'stationName');
        const total = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
        res.json({ totalEarnings: total, paidBookings: bookings.length, bookings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get available ports per time slot for a station on a specific date
// @route  GET /api/bookings/availability
const getAvailability = async (req, res) => {
    try {
        const { stationId, date } = req.query;

        if (!stationId || !date) {
            return res.status(400).json({ message: 'Station ID and date are required' });
        }

        const station = await ChargingStation.findById(stationId);
        if (!station) return res.status(404).json({ message: 'Station not found' });

        const totalPorts = station.totalPorts;

        // Dynamic 1-hour intervals based on station hours
        const openingTime = station.openingTime || '09:00';
        const closingTime = station.closingTime || '18:00';
        
        let [openH, openM] = openingTime.split(':').map(Number);
        let [closeH, closeM] = closingTime.split(':').map(Number);

        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        const now = new Date();
        const isToday = queryDate.toDateString() === now.toDateString();

        const uiTimeSlots = [];
        let currentH = openH;
        let currentM = openM;

        while (currentH < closeH || (currentH === closeH && currentM < closeM)) {
            let nextH = currentH + 1;
            let nextM = currentM;

            if (nextH > closeH || (nextH === closeH && nextM > closeM)) {
                nextH = closeH;
                nextM = closeM;
            }

            const slotStart = new Date(queryDate);
            slotStart.setHours(currentH, currentM, 0, 0);

            // Add the slot only if it is in the future (or if the day is not today)
            // If the requested date is strictly in the past, no slots are pushed.
            if (slotStart > now || (!isToday && queryDate > now)) {
                const formatTime = (h, m) => {
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const hr12 = h % 12 || 12;
                    return `${hr12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
                };

                const timeStr = `${formatTime(currentH, currentM)} - ${formatTime(nextH, nextM)}`;
                uiTimeSlots.push(timeStr);
            }

            currentH = nextH;
            currentM = nextM;
        }

        const bookings = await Booking.find({
            station: stationId,
            bookingDate: { $gte: startOfDay, $lte: endOfDay },
            paymentStatus: 'paid'
        });

        const availability = uiTimeSlots.map(timeRange => {
            const [s, e] = timeRange.split(' - ');
            // Convert "09:00 AM - 10:00 AM" to "09:00" and "10:00" for comparison
            const parseToHHMM = (timeStr) => {
                let [time, ampm] = timeStr.split(' ');
                let [h, m] = time.split(':').map(Number);
                if (ampm === 'PM' && h < 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            };

            const slotStart = parseToHHMM(s);
            const slotEnd = parseToHHMM(e);

            const bookedCount = bookings.filter(b => 
                isOverlapping(slotStart, slotEnd, b.startTime, b.endTime)
            ).length;

            return {
                time: timeRange,
                availablePorts: Math.max(0, totalPorts - bookedCount)
            };
        });

        res.json(availability);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Owner starts manual charging session for walk-in user
// @route  POST /api/bookings/owner/start-charging
const startCharging = async (req, res) => {
    try {
        const { stationId, portNumber } = req.body;
        const station = await ChargingStation.findById(stationId);
        if (!station) return res.status(404).json({ message: 'Station not found' });

        // Check if port is already active
        const existingActive = await Booking.findOne({
            station: stationId,
            portNumber,
            bookingStatus: 'active'
        });

        if (existingActive) {
            return res.status(400).json({ message: `Port ${portNumber} is already in use.` });
        }

        const now = new Date();
        const startTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const booking = await Booking.create({
            station: stationId,
            portNumber,
            bookingDate: now,
            startTime: startTimeStr,
            bookingStatus: 'active',
            source: 'offline',
            paymentStatus: 'pending'
        });

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Owner stops manual charging session
// @route  POST /api/bookings/owner/stop-charging
const stopCharging = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId).populate('station');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.bookingStatus !== 'active') {
            return res.status(400).json({ message: 'Session is not active' });
        }

        const now = new Date();
        const endTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Calculate amount based on duration and station price
        const startMin = timeToMinutes(booking.startTime);
        const endMin = timeToMinutes(endTimeStr);
        let durationHours = (endMin - startMin) / 60;
        
        // If it wrapped around or is very short, ensure minimum or handle date switch
        if (durationHours < 0) durationHours += 24; 
        
        const totalAmount = Math.max(0.1, durationHours * booking.station.pricePerHour);

        booking.endTime = endTimeStr;
        booking.bookingStatus = 'completed';
        booking.paymentStatus = 'offline_paid';
        booking.totalAmount = parseFloat(totalAmount.toFixed(2));
        await booking.save();

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc   Get live port status for owner dashboard
// @route  GET /api/bookings/owner/station/:id/ports
const getPortStatus = async (req, res) => {
    try {
        const stationId = req.params.id;
        const station = await ChargingStation.findById(stationId);
        if (!station) return res.status(404).json({ message: 'Station not found' });

        const activeBookings = await Booking.find({
            station: stationId,
            bookingStatus: 'active'
        });

        const ports = [];
        for (let i = 1; i <= station.totalPorts; i++) {
            const activeBooking = activeBookings.find(b => b.portNumber === i);
            ports.push({
                portId: i,
                portNumber: i,
                status: activeBooking ? 'busy' : 'available',
                booking: activeBooking || null
            });
        }

        res.json({
            stationName: station.stationName,
            totalPorts: station.totalPorts,
            usedPorts: activeBookings.length,
            availablePorts: Math.max(0, station.totalPorts - activeBookings.length),
            ports
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    initiateBooking,
    confirmBooking,
    getUserBookings,
    getOwnerBookings,
    getOwnerEarnings,
    getAvailability,
    startCharging,
    stopCharging,
    getPortStatus
};
