const express = require("express");
const router = express.Router();
const testimoniController = require("../controllers/testimoniController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  uploadFotoTestimoni,
} = require("../middleware/uploadTestimoniMiddleware");

// Public routes
router.get("/", testimoniController.getAllTestimoni);
router.get("/:id", testimoniController.getTestimoniById);

// Protected routes (require authentication)
router.post(
  "/",
  authenticate,
  (req, res, next) => {
    uploadFotoTestimoni(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  testimoniController.createTestimoni
);
router.put(
  "/:id",
  authenticate,
  (req, res, next) => {
    uploadFotoTestimoni(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file",
        });
      }
      next();
    });
  },
  testimoniController.updateTestimoni
);
router.delete("/:id", authenticate, testimoniController.deleteTestimoni);

module.exports = router;
