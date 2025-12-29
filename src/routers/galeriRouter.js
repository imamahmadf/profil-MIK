const express = require("express");
const router = express.Router();
const galeriController = require("../controllers/galeriController");
const { authenticate } = require("../middleware/authMiddleware");
const { uploadFotoGaleri } = require("../middleware/uploadGaleriMiddleware");

// Public routes
router.get("/", galeriController.getAllGaleri);
router.get("/:id", galeriController.getGaleriById);

// Protected routes (require authentication)
router.post(
  "/",
  authenticate,
  (req, res, next) => {
    uploadFotoGaleri(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  galeriController.createGaleri
);
router.put(
  "/:id",
  authenticate,
  (req, res, next) => {
    uploadFotoGaleri(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  galeriController.updateGaleri
);
router.delete("/:id", authenticate, galeriController.deleteGaleri);

module.exports = router;
