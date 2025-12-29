// Export semua routers di sini
const authRouter = require("./authRouter");
const userRouter = require("./userRouter");
const beritaRouter = require("./beritaRouter");
const galeriRouter = require("./galeriRouter");

module.exports = {
  authRouter,
  userRouter,
  beritaRouter,
  galeriRouter,
};
