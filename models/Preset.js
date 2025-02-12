const mongoose = require('mongoose');

const PresetSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Relasi ke User
    title: { type: String, required: true }, // Nama preset
    videoUrl: { type: String, required: true }, // Link video TikTok/Shorts
    presetUrl: { type: String, required: true }, // Link download preset
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Preset', PresetSchema);