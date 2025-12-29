// Export semua routers di sini
const authRouter = require("./authRouter");
const userRouter = require("./userRouter");
const beritaRouter = require("./beritaRouter");
const galeriRouter = require("./galeriRouter");
const rekamJejakRouter = require("./rekamJejakRouter");

module.exports = {
  authRouter,
  userRouter,
  beritaRouter,
  galeriRouter,
  rekamJejakRouter,
};
