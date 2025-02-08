const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Penerima notif
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Pengirim notif
    type: { type: String, enum: ['follow', 'like', 'comment'], required: true },
    preset: { type: mongoose.Schema.Types.ObjectId, ref: 'Preset', default: null }, // Kalau like/komen, preset mana?
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }, // Apakah notif sudah dibaca?
    createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
