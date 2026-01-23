const { Logo, JenisLogo } = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

/**
 * Get all logo dengan pagination dan search
 */
const getAllLogo = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const jenisLogoId = req.query.jenisLogoId;

    const where = {};
    if (jenisLogoId) {
      where.jenisLogoId = jenisLogoId;
    }

    const { count, rows } = await Logo.findAndCountAll({
      where,
      include: [
        {
          model: JenisLogo,
          as: "jenisLogo",
          attributes: ["id", "nama"],
        },
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error in getAllLogo:", error);
    next(error);
  }
};

/**
 * Get logo by ID
 */
const getLogoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const logo = await Logo.findByPk(id, {
      include: [
        {
          model: JenisLogo,
          as: "jenisLogo",
          attributes: ["id", "nama"],
        },
      ],
    });

    if (!logo) {
      return res.status(404).json({
        success: false,
        message: "Logo tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: logo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new logo
 */
const createLogo = async (req, res, next) => {
  try {
    const { jenisLogoId } = req.body;

    // Validasi
    if (!jenisLogoId) {
      return res.status(400).json({
        success: false,
        message: "Jenis Logo harus dipilih",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Gambar logo harus diupload",
      });
    }

    // Validasi jenisLogoId ada di database
    const jenisLogo = await JenisLogo.findByPk(jenisLogoId);
    if (!jenisLogo) {
      return res.status(404).json({
        success: false,
        message: "Jenis Logo tidak ditemukan",
      });
    }

    const gambarLogoPath = `/uploads/logo/${req.file.filename}`;

    const logo = await Logo.create({
      jenisLogoId,
      gambarLogo: gambarLogoPath,
    });

    // Reload dengan include jenisLogo
    await logo.reload({
      include: [
        {
          model: JenisLogo,
          as: "jenisLogo",
          attributes: ["id", "nama"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Logo berhasil dibuat",
      data: logo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update logo
 */
const updateLogo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { jenisLogoId } = req.body;

    const logo = await Logo.findByPk(id);

    if (!logo) {
      return res.status(404).json({
        success: false,
        message: "Logo tidak ditemukan",
      });
    }

    // Update jenisLogoId jika diberikan
    if (jenisLogoId) {
      // Validasi jenisLogoId ada di database
      const jenisLogo = await JenisLogo.findByPk(jenisLogoId);
      if (!jenisLogo) {
        return res.status(404).json({
          success: false,
          message: "Jenis Logo tidak ditemukan",
        });
      }
      logo.jenisLogoId = jenisLogoId;
    }

    // Handle gambar logo upload
    if (req.file) {
      // Hapus gambar lama jika ada
      if (logo.gambarLogo) {
        const oldGambarPath = path.join(
          __dirname,
          "../../public",
          logo.gambarLogo
        );
        if (fs.existsSync(oldGambarPath)) {
          fs.unlinkSync(oldGambarPath);
        }
      }
      // Simpan path gambar baru
      logo.gambarLogo = `/uploads/logo/${req.file.filename}`;
    }

    await logo.save();

    // Reload dengan include jenisLogo
    await logo.reload({
      include: [
        {
          model: JenisLogo,
          as: "jenisLogo",
          attributes: ["id", "nama"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Logo berhasil diupdate",
      data: logo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete logo
 */
const deleteLogo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const logo = await Logo.findByPk(id);

    if (!logo) {
      return res.status(404).json({
        success: false,
        message: "Logo tidak ditemukan",
      });
    }

    // Hapus gambar dari server
    if (logo.gambarLogo) {
      const gambarPath = path.join(__dirname, "../../public", logo.gambarLogo);
      if (fs.existsSync(gambarPath)) {
        fs.unlinkSync(gambarPath);
      }
    }

    await logo.destroy();

    res.status(200).json({
      success: true,
      message: "Logo berhasil dihapus",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLogo,
  getLogoById,
  createLogo,
  updateLogo,
  deleteLogo,
};

