require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// REGISTER USER
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Cek apakah user sudah ada
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'Email sudah digunakan' });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Buat user baru
        user = new User({ username, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'User berhasil didaftarkan' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// LOGIN USER
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Cek apakah user ada
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Email atau password salah' });

        // Cek password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Email atau password salah' });

        // Buat token JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;