const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "src/config/.env") });
const express = require("express");
const cors = require("cors");
const { join, dirname } = require("path");

const { env, port, whitelistedDomain } = require("./src/config");
const { sequelize } = require("./src/database");
const {
  authRouter,
  userRouter,
  beritaRouter,
  galeriRouter,
  rekamJejakRouter,
  heroRouter,
  testimoniRouter,
  biografiRouter,
  temaPublikasiRouter,
  publikasiRouter,
  pesanRouter,
  pengalamanRouter,
  tentangRouter,
  faktaUnikRouter,
  logoRouter,
  jenisLogoRouter,
} = require("./src/routers");

const PORT = port || 7000;
const app = express();

app.use(
  cors({
    origin: whitelistedDomain,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Static files untuk uploads
app.use("/uploads", express.static(`${__dirname}/public/uploads`));
app.use("/api", express.static(`${__dirname}/public`));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/berita", beritaRouter);
app.use("/api/galeri", galeriRouter);
app.use("/api/rekam-jejak", rekamJejakRouter);
app.use("/api/hero", heroRouter);
app.use("/api/testimoni", testimoniRouter);
app.use("/api/biografi", biografiRouter);
app.use("/api/tema-publikasi", temaPublikasiRouter);
app.use("/api/publikasi", publikasiRouter);
app.use("/api/pesan", pesanRouter);
app.use("/api/pengalaman", pengalamanRouter);
app.use("/api/tentang", tentangRouter);
app.use("/api/fakta-unik", faktaUnikRouter);
app.use("/api/logo", logoRouter);
app.use("/api/jenis-logo", jenisLogoRouter);
app.get("/api", (req, res) => {
  res.send(`Hello, this is my API`);
});

app.get("/api/greetings", (req, res, next) => {
  res.status(200).json({
    message: "Hello, guys !",
  });
});

// ===========================

// not found
app.use((req, res, next) => {
  if (req.path.includes("/api/")) {
    res.status(404).send("Not found !");
  } else {
    next();
  }
});

// error
app.use((err, req, res, next) => {
  if (req.path.includes("/api/")) {
    console.error("Error : ", err.message);
    console.error("Stack : ", err.stack);

    // Handle Sequelize errors
    if (err.name === "SequelizeDatabaseError") {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }

    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.errors?.map((e) => e.message) || [],
      });
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  } else {
    next();
  }
});

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Koneksi database berhasil.");
  } catch (error) {
    console.error("❌ Tidak dapat terhubung ke database:", error);
  }
}

// Start server
async function startServer() {
  await testConnection();

  app.listen(PORT, (err) => {
    if (err) {
      console.log(`ERROR: ${err}`);
    } else {
      console.log(`APP RUNNING at ${PORT} ✅`);
      console.log(`🌐 CORS enabled for: ${whitelistedDomain.join(", ")}`);
      console.log(`📡 API available at: http://localhost:${PORT}/api`);
    }
  });
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Menutup server...");
  await sequelize.close();
  process.exit(0);
});

startServer().catch((error) => {
  console.error("❌ Error memulai server:", error);
  process.exit(1);
});

module.exports = app;
