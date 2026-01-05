const express = require("express");
const router = express.Router();
const publikasiController = require("../controllers/publikasiController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  uploadFotoPublikasi,
} = require("../middleware/uploadPublikasiMiddleware");

// Public routes
router.get("/", publikasiController.getAllPublikasi);
router.get("/:id", publikasiController.getPublikasiById);

// Protected routes (require authentication)
router.post(
  "/",
  authenticate,
  (req, res, next) => {
    uploadFotoPublikasi(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  publikasiController.createPublikasi
);
router.put(
  "/:id",
  authenticate,
  (req, res, next) => {
    uploadFotoPublikasi(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  publikasiController.updatePublikasi
);
router.delete("/:id", authenticate, publikasiController.deletePublikasi);

module.exports = router;
