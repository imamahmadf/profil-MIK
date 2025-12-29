const express = require("express");
const router = express.Router();
const beritaController = require("../controllers/beritaControllers");
const { authenticate } = require("../middleware/authMiddleware");
const {
  uploadFoto,
  uploadMultipleFoto,
} = require("../middleware/uploadMiddleware");

// Public routes
router.get("/", beritaController.getAllBerita);
router.get("/:id", beritaController.getBeritaById);
router.get("/slug/:slug", beritaController.getBeritaBySlug);

// Protected routes (require authentication)
router.post(
  "/",
  authenticate,
  (req, res, next) => {
    uploadMultipleFoto(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  beritaController.createBerita
);
router.put(
  "/:id",
  authenticate,
  (req, res, next) => {
    uploadMultipleFoto(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  beritaController.updateBerita
);
router.delete("/:id", authenticate, beritaController.deleteBerita);

module.exports = router;
