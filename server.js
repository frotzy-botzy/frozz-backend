require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const axios = require("axios");

const app = express();
connectDB();

// Middleware untuk keamanan
app.use(helmet()); // Tambahkan header keamanan
app.use(mongoSanitize()); // Mencegah NoSQL Injection

// Konfigurasi CORS
const corsOptions = {
  origin: ["http://172.23.5.80:5173", "http://localhost:5173"], // Tambahkan domain frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions)); // Pastikan CORS dipanggil sebelum limiter

// Middleware untuk parsing JSON
app.use(express.json());

// Rate limiter (setelah CORS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 1000, // Maksimal 100 request per IP dalam 15 menit
  message: "Terlalu banyak request, coba lagi nanti.",
});
app.use(limiter);

// Rute utama
app.get("/", (req, res) => {
  res.send("API Running");
});

// Rute API
app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));
app.use("/api/preset", require("./routes/preset"));
app.use("/api/notifications", require("./routes/notification"));

// Direktori statis untuk file upload
app.use("/uploads", express.static("uploads"));

// Proxy untuk TikTok
app.get("/proxy/tiktok", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL diperlukan" });
  }

  try {
    // Lakukan request ke TikTok dengan axios
    const response = await axios.head(url, {
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Referer": "https://www.tiktok.com/",
      },
    });

    // Ambil URL asli setelah redirect
    const realUrl = response.request.res.responseUrl;

    // Ubah URL menjadi format embed
    const videoIdMatch = realUrl.match(/\/video\/(\d+)/);
    if (videoIdMatch) {
      const videoId = videoIdMatch[1];
      const embedUrl = `https://www.tiktok.com/embed/v3/${videoId}?&rel=0`;
      res.json({ embedUrl });
    } else {
      throw new Error("URL tidak ditemukan.");
    }
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil URL TikTok" });
  }
});

// Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));