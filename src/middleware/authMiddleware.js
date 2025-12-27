const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { jwtSecret } = require("../config");

/**
 * Middleware untuk verify JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Ambil token dari header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const decoded = jwt.verify(token, jwtSecret);

    // Cari user berdasarkan ID dari token
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    // Attach user ke request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token telah kadaluarsa",
      });
    }

    next(error);
  }
};

module.exports = {
  authenticate,
};
