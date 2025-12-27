const express = require("express");
const router = express.Router();
// const userController = require('../controllers/userController');

// Contoh routes
// router.get('/', userController.getAll);
// router.get('/:id', userController.getById);
// router.post('/', userController.create);
// router.put('/:id', userController.update);
// router.delete('/:id', userController.delete);

router.get("/", (req, res) => {
  res.json({ message: "User router - belum diimplementasi" });
});

module.exports = router;
