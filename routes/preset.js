const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Preset = require('../models/Preset');
const Comment = require('../models/Comment');

const { sendNotification } = require('../controllers/notificationController');

const router = express.Router();

// API GET Semua Preset Secara Acak
router.get('/random', async (req, res) => {
    try {
        const presets = await Preset.aggregate([{ $sample: { size: 10 } }]); // Ambil 10 preset secara acak
        res.json(presets);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// UPLOAD PRESET (Hanya user yang login)
router.post('/upload', auth, async (req, res) => {
    try {
        const { title, videoUrl, presetUrl, likes } = req.body;
        
        if (!title || !videoUrl || !presetUrl) {
            return res.status(400).json({ message: 'Semua field harus diisi' });
        }

        const newPreset = new Preset({
            user: req.user.id,
            title,
            videoUrl,
            presetUrl,
            likes
        });

        await newPreset.save();
        res.status(201).json({ message: 'Preset berhasil diupload', preset: newPreset });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET Semua Preset Milik User (Hanya user yang login)
router.get('/my-presets', auth, async (req, res) => {
    try {
        const presets = await Preset.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json({ presets });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// HAPUS PRESET (Hanya bisa menghapus preset milik sendiri)
router.delete('/delete/:id', auth, async (req, res) => {
    try {
        const preset = await Preset.findById(req.params.id);

        if (!preset) {
            return res.status(404).json({ message: 'Preset tidak ditemukan' });
        }

        // Cek apakah preset ini milik user yang sedang login
        if (preset.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Akses ditolak' });
        }

        await preset.deleteOne();
        res.json({ message: 'Preset berhasil dihapus' });

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// EDIT PRESET (Hanya bisa edit preset milik sendiri)
router.put('/edit/:id', auth, async (req, res) => {
    try {
        const { title, videoUrl, presetUrl } = req.body;
        const preset = await Preset.findById(req.params.id);

        if (!preset) {
            return res.status(404).json({ message: 'Preset tidak ditemukan' });
        }

        // Cek apakah preset ini milik user yang sedang login
        if (preset.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Akses ditolak' });
        }

        // Update data preset
        preset.title = title || preset.title;
        preset.videoUrl = videoUrl || preset.videoUrl;
        preset.presetUrl = presetUrl || preset.presetUrl;

        await preset.save();
        res.json({ message: 'Preset berhasil diperbarui', preset });

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// API LIKE/UNLIKE PRESET
// Cek apakah user sudah nge-like
router.post('/like/:presetId', auth, async (req, res) => {
    try {
        const { presetId } = req.params;
        const userId = req.user.id; // Ambil ID user dari token JWT

        const preset = await Preset.findById(presetId);
        if (!preset) {
            return res.status(404).json({ message: 'Preset tidak ditemukan' });
        }

        // Cek apakah user sudah nge-like
        const alreadyLiked = preset.likes.includes(userId);
        if (alreadyLiked) {
            // Kalau sudah like, hapus dari array (unlike)
            preset.likes = preset.likes.filter(id => id.toString() !== userId);
        } else {
            // Kalau belum, tambahkan userId ke array likes
            preset.likes.push(userId);

            // Ambil data user yang melakukan like
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User tidak ditemukan' });
            }

            await sendNotification(preset.user._id, user, 'like', preset._id);
        }

        await preset.save();
        res.json({ likes: preset.likes.length, message: alreadyLiked ? "Unliked" : "Liked" });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET SEMUA PRESET MILIK USER TERTENTU BERDASARKAN USER ID
router.get('/user/:id', async (req, res) => {
    try {
        console.log("API dipanggil");  // Cek apakah API dipanggil
        const { id } = req.params;
        console.log("Mencari preset untuk user dengan ID:", id);

        // Opsional: Cek apakah ID valid (jika menggunakan mongoose)
        // if (!mongoose.Types.ObjectId.isValid(id)) {
        //     return res.status(400).json({ message: 'User ID tidak valid' });
        // }

        const user = await User.findById(id);
        if (!user) {
            console.log("User tidak ditemukan");
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        const presets = await Preset.find({ user: id }).sort({ createdAt: -1 });
        res.json({ presets });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET PRESET BERDASARKAN KODE
// router.get('/:username/:presetId', async (req, res) => {
//     try {
//         const { username, presetId } = req.params;
//         console.log(`Mencari user dengan username: ${username} dan presetId: ${presetId}`);

//         // Cari user berdasarkan username
//         const user = await User.findOne({ username });
//         if (!user) {
//             console.log('User tidak ditemukan');
//             return res.status(404).json({ message: 'User tidak ditemukan' });
//         }

//         // Cari preset berdasarkan ID dan pastikan milik user tersebut
//         const preset = await Preset.findOne({ _id: presetId, user: user._id });
//         if (!preset) {
//             console.log('Preset tidak ditemukan');
//             return res.status(404).json({ message: 'Preset tidak ditemukan' });
//         }

//         res.json({ preset });

//     } catch (err) {
//         console.error('Terjadi kesalahan:', err.message);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// API TAMBAH KOMENTAR
router.post('/comment/:presetId', auth, async (req, res) => {
    try {
        const { presetId } = req.params;
        const { text } = req.body;
        const userId = req.user.id; // Ambil ID user dari token JWT

        if (!text) {
            return res.status(400).json({ message: 'Komentar tidak boleh kosong' });
        }

        const preset = await Preset.findById(presetId);
        if (!preset) {
            return res.status(404).json({ message: 'Preset tidak ditemukan' });
        }

        // Buat komentar baru
        const newComment = new Comment({
            preset: presetId,
            user: userId,
            text
        });

        // Ambil data user yang melakukan komentar
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        await sendNotification(preset.user._id, user, 'comment', preset._id);

        await newComment.save();
        res.json({ message: 'Komentar berhasil ditambahkan' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// API AMBIL SEMUA KOMENTAR DI PRESET
router.get('/comments/:presetId', async (req, res) => {
    try {
        const { presetId } = req.params;

        const comments = await Comment.find({ preset: presetId })
            .populate('user', 'username') // Ambil info user yang komentar
            .sort({ createdAt: -1 }); // Urutkan dari yang terbaru

        res.json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// API EDIT KOMENTAR
router.put('/comment/:commentId', auth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { text } = req.body;
        const userId = req.user.id; // Ambil ID user dari token JWT

        if (!text) {
            return res.status(400).json({ message: 'Komentar tidak boleh kosong' });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Komentar tidak ditemukan' });
        }

        // Pastikan user hanya bisa edit komentarnya sendiri
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ message: 'Kamu tidak punya akses untuk edit komentar ini' });
        }

        comment.text = text;
        await comment.save();
        res.json({ message: 'Komentar berhasil diperbarui' });

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// API HAPUS KOMENTAR
router.delete('/comment/:commentId', auth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id; // Ambil ID user dari token JWT

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Komentar tidak ditemukan' });
        }

        // Pastikan hanya owner komentar atau admin yang bisa hapus
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ message: 'Kamu tidak punya akses untuk menghapus komentar ini' });
        }

        await Comment.findByIdAndDelete(commentId);
        res.json({ message: 'Komentar berhasil dihapus' });

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/explore', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Misal per halaman ada 10 data
        const skip = (page - 1) * limit;

        const presets = await Preset.find()
            .populate('user', 'username profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json(presets);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});


// API GET Trending Preset
router.get('/trending', async (req, res) => {
    try {
        const trendingPresets = await Preset.find()
            .populate('user', 'username profilePicture')
            .sort({ likes: -1 }) // Sort berdasarkan jumlah like terbanyak
            .limit(10); // Ambil 10 preset teratas

        res.json(trendingPresets);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// API Search Preset
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const regex = new RegExp(query, 'i');

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const presets = await Preset.find({
            $or: [
                { title: regex },
                { 'user.username': regex }
            ]
        })
        .populate('user', 'username profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        res.json(presets);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

//API BOOKMARK
router.post('/bookmark/:presetId', auth, async (req, res) => {
    try {
      const { presetId } = req.params;
      const userId = req.user.id;
  
      // Ambil preset dari database
      const preset = await Preset.findById(presetId);
      if (!preset) {
        return res.status(404).json({ message: 'Preset tidak ditemukan!' });
      }
  
      // Ambil data user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }
  
      // Cek apakah preset sudah ada di bookmarks user
      const alreadyBookmarked = user.bookmarks.includes(presetId);
  
      if (alreadyBookmarked) {
        // Unbookmark: Hapus preset dari user.bookmarks dan hapus user dari preset.bookmarkedBy
        user.bookmarks = user.bookmarks.filter(id => id.toString() !== presetId);
        preset.bookmarkedBy = preset.bookmarkedBy.filter(id => id.toString() !== userId);
  
        await user.save();
        await preset.save();
  
        return res.json({
          bookmarks: preset.bookmarkedBy.length,
          message: 'Preset dihapus dari favorit!',
          userBookmarks: user.bookmarks,
          presetBookmarks: preset.bookmarkedBy
        });
      } else {
        // Bookmark: Tambahkan preset ke user.bookmarks dan user ke preset.bookmarkedBy
        user.bookmarks.push(presetId);
        if (!preset.bookmarkedBy.includes(userId)) {
          preset.bookmarkedBy.push(userId);
        }
  
        await user.save();
        await preset.save();
  
        // Kirim notifikasi sebelum mengirim respon
        await sendNotification(preset.user._id, user, 'bookmark', preset._id);
  
        return res.json({
          bookmarks: preset.bookmarkedBy.length,
          message: 'Preset ditambahkan ke favorit!',
          userBookmarks: user.bookmarks,
          presetBookmarks: preset.bookmarkedBy
        });
      }
    } catch (err) {
      console.error('Error pada bookmark endpoint:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });
   

// API Get Semua Bookmark User
router.get('/bookmarks', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('bookmarks');
        res.json(user.bookmarks);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});


// API Edit Preset
router.put('/edit/:presetId', auth, async (req, res) => {
    try {
        const { title, videoUrl, presetUrl } = req.body;
        const preset = await Preset.findById(req.params.presetId);

        if (!preset) {
            return res.status(404).json({ message: 'Preset tidak ditemukan!' });
        }

        // Cek apakah user yang login adalah pemilik preset
        if (preset.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Akses ditolak!' });
        }

        // Update data preset
        preset.title = title || preset.title;
        preset.videoUrl = videoUrl || preset.videoUrl;
        preset.presetUrl = presetUrl || preset.presetUrl;

        await preset.save();
        res.json({ message: 'Preset berhasil diperbarui!', preset });

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// API Hapus Preset
router.delete('/delete/:presetId', auth, async (req, res) => {
    try {
        const preset = await Preset.findById(req.params.presetId);

        if (!preset) {
            return res.status(404).json({ message: 'Preset tidak ditemukan!' });
        }

        // Cek apakah user yang login adalah pemilik preset
        if (preset.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Akses ditolak!' });
        }

        await preset.deleteOne();
        res.json({ message: 'Preset berhasil dihapus!' });

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});




module.exports = router;