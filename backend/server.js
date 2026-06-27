require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const referralRoutes = require("./routes/referral");
const dashboardRoutes = require("./routes/dashboard");
const poolRoutes = require("./routes/pool");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Saglik kontrolu ────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

// ─── Rotalar ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/pool", poolRoutes);

// ─── Global hata yonetimi (en son) ──────────────────────────────────────────
app.use(errorHandler);

// ─── Sunucuyu baslat (test ortaminda baslatma) ──────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Monad Kampus backend ${PORT} portunda calisiyor`);
    });
  });
}

module.exports = app;
