const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('Menghubungkan ke MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000 // Timeout setelah 5 detik
        });
        console.log('MongoDB Terhubung...');
    } catch (err) {
        console.error('Kesalahan saat menghubungkan ke MongoDB:', err.message);
        console.error(err);
        process.exit(1);
    }
}

module.exports = connectDB;