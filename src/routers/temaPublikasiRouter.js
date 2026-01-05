const express = require("express");
const router = express.Router();
const temaPublikasiController = require("../controllers/temaPublikasiController");
const { authenticate } = require("../middleware/authMiddleware");

// Public routes
router.get("/", temaPublikasiController.getAllTemaPublikasi);
router.get("/:id", temaPublikasiController.getTemaPublikasiById);

// Protected routes (require authentication)
router.post("/", authenticate, temaPublikasiController.createTemaPublikasi);
router.put("/:id", authenticate, temaPublikasiController.updateTemaPublikasi);
router.delete(
  "/:id",
  authenticate,
  temaPublikasiController.deleteTemaPublikasi
);

module.exports = router;
