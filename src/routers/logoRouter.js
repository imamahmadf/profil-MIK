const express = require("express");
const router = express.Router();
const logoController = require("../controllers/logoController");
const { authenticate } = require("../middleware/authMiddleware");
const { uploadGambarLogo } = require("../middleware/uploadLogoMiddleware");

// Public routes
router.get("/", logoController.getAllLogo);
router.get("/:id", logoController.getLogoById);

// Protected routes (require authentication)
router.post(
  "/",
  authenticate,
  (req, res, next) => {
    uploadGambarLogo(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  logoController.createLogo
);
router.put(
  "/:id",
  authenticate,
  (req, res, next) => {
    uploadGambarLogo(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  logoController.updateLogo
);
router.delete("/:id", authenticate, logoController.deleteLogo);

module.exports = router;

