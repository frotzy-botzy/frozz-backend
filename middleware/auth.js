const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.header('Authorization');

    if (!token) return res.status(401).json({ message: 'Akses ditolak, tidak ada token' });

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.user = decoded; // Simpan data user di req.user
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token tidak valid' });
    }
};