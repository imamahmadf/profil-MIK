const express = require("express");
const router = express.Router();
const faktaUnikController = require("../controllers/faktaUnikController");
const { authenticate } = require("../middleware/authMiddleware");

// Public routes
router.get("/", faktaUnikController.getAllFaktaUnik);
router.get("/:id", faktaUnikController.getFaktaUnikById);

// Protected routes (require authentication)
router.post("/", authenticate, faktaUnikController.createFaktaUnik);
router.put("/:id", authenticate, faktaUnikController.updateFaktaUnik);
router.delete("/:id", authenticate, faktaUnikController.deleteFaktaUnik);

module.exports = router;
