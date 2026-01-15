// Export semua routers di sini
const authRouter = require("./authRouter");
const userRouter = require("./userRouter");
const beritaRouter = require("./beritaRouter");
const galeriRouter = require("./galeriRouter");
const rekamJejakRouter = require("./rekamJejakRouter");
const heroRouter = require("./heroRouter");
const testimoniRouter = require("./testimoniRouter");
const biografiRouter = require("./biografiRouter");
const temaPublikasiRouter = require("./temaPublikasiRouter");
const publikasiRouter = require("./publikasiRouter");
const pesanRouter = require("./pesanRouter");
const pengalamanRouter = require("./pengalamanRouter");
const tentangRouter = require("./tentangRouter");
const faktaUnikRouter = require("./faktaUnikRouter");

module.exports = {
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
};
