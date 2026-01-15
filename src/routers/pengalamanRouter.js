const express = require("express");
const router = express.Router();
const pengalamanController = require("../controllers/pengalamanController");
const { authenticate } = require("../middleware/authMiddleware");

// Public routes
router.get("/", pengalamanController.getAllPengalaman);
router.get("/:id", pengalamanController.getPengalamanById);

// Protected routes (require authentication)
router.post("/", authenticate, pengalamanController.createPengalaman);
router.put("/:id", authenticate, pengalamanController.updatePengalaman);
router.delete("/:id", authenticate, pengalamanController.deletePengalaman);

router.get("/cek-database", pengalamanController.cekDataBase);
module.exports = router;
