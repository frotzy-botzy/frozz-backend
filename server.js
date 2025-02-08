require('dotenv').config();// Tambahkan ini untuk memastikan MONGO_URI telah dimuat
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
res.send('API Running');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/preset', require('./routes/preset'));
app.use('/api/notification', require('./routes/notification'));
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Maksimal 100 request per IP dalam 15 menit
  message: "Terlalu banyak request, coba lagi nanti.",
});

app.use(limiter);

const corsOptions = {
    origin: ["https://frozz.com", "http://localhost:3000"], // Tambahkan domain frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");

app.use(mongoSanitize()); // Mencegah NoSQL Injection
app.use(helmet()); // Menambahkan keamanan HTTP Headers
