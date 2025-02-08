const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// API AMBIL NOTIFIKASI USER
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.find({ user: userId })
            .populate('sender', 'username profilePicture')
            .populate('preset', 'title')
            .sort({ createdAt: -1 });

        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// API SET NOTIFIKASI JADI TERBACA
router.put('/read/:notifId', auth, async (req, res) => {
    try {
        const { notifId } = req.params;
        const notification = await Notification.findById(notifId);

        if (!notification) {
            return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
        }

        notification.isRead = true;
        await notification.save();
        res.json({ message: 'Notifikasi telah dibaca' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
