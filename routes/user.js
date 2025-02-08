const express = require('express');
const upload = require('../middleware/upload');
const User = require('../models/User');
const auth = require('../middleware/auth');

const { sendNotification } = require('../controllers/notificationController');

const router = express.Router();

// PROTEKSI API: Hanya user yang login bisa akses
router.get('/dashboard', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({ message: 'Selamat datang di dashboard!', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// API FOLLOW/UNFOLLOW USER
router.post('/follow/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id; // Ambil ID user dari token JWT

        if (userId === currentUserId) {
            return res.status(400).json({ message: "Kamu tidak bisa follow diri sendiri" });
        }

        const userToFollow = await User.findById(userId);
        const currentUser = await User.findById(currentUserId);

        if (!userToFollow) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Cek apakah sudah follow atau belum
        const alreadyFollowing = currentUser.following.includes(userId);

        if (alreadyFollowing) {
            // Jika sudah follow, maka unfollow
            currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
            userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== currentUserId);
            await userToFollow.save();
            await currentUser.save();
            return res.json({ message: "Berhasil unfollow" });
        } else {
            // Jika belum follow, maka follow
            currentUser.following.push(userId);
            userToFollow.followers.push(currentUserId);
            await userToFollow.save();
            await currentUser.save();
            await sendNotification(userToFollow._id, currentUser, 'follow');
            return res.json({ message: "Berhasil follow" });
            
        }

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// API AMBIL FOLLOWERS USER
router.get('/followers/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).populate('followers', 'username profilePicture');
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        res.json(user.followers);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// API AMBIL FOLLOWING USER
router.get('/following/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).populate('following', 'username profilePicture');
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        res.json(user.following);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});



// API Upload Avatar
router.post('/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Harap upload gambar!' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan!' });
        }

        // Simpan URL avatar ke database
        user.profilePicture = `/uploads/${req.file.filename}`;
        await user.save();

        res.json({ message: 'Avatar berhasil diunggah!', profilePicture: user.profilePicture });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;