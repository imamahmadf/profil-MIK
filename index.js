const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "src/config/.env") });
const express = require("express");
const cors = require("cors");
const { join, dirname } = require("path");

const { env, port, whitelistedDomain } = require("./src/config");
const { sequelize } = require("./src/database");
const { authRouter, userRouter } = require("./src/routers");

const PORT = port || 7000;
const app = express();

app.use(
  cors({
    origin: whitelistedDomain,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/api", express.static(`${__dirname}/public`));

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

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
    console.error("Error : ", err.stack);
    res.status(500).send("Error !");
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
