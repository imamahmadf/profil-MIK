const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User } = require("../models");
const { jwtSecret } = require("../config");

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username dan password harus diisi",
      });
    }

    // Cari user berdasarkan username atau email
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email: username }],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah",
      });
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: "7d", // Token berlaku 7 hari
      }
    );

    // Response sesuai format yang diharapkan frontend
    // Frontend mengharapkan { user, token } langsung
    res.status(200).json({
      user: {
        id: user.id.toString(),
        username: user.username || user.email,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user (verify token)
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // User sudah di-attach oleh middleware auth
    const user = req.user;

    res.status(200).json({
      user: {
        id: user.id.toString(),
        username: user.username || user.email,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getCurrentUser,
};
