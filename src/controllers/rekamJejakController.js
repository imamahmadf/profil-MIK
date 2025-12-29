const { RekamJejak } = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

/**
 * Get all rekamJejak dengan search
 */
const getAllRekamJejak = async (req, res, next) => {
  try {
    const rekamJejak = await RekamJejak.findAll({
      order: [["id", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: rekamJejak,
    });
  } catch (error) {
    console.error("Error in getAllRekamJejak:", error);
    next(error);
  }
};

/**
 * Get rekamJejak by ID
 */
const getRekamJejakById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rekamJejak = await RekamJejak.findByPk(id);

    if (!rekamJejak) {
      return res.status(404).json({
        success: false,
        message: "Rekam jejak tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: rekamJejak,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new rekamJejak
 */
const createRekamJejak = async (req, res, next) => {
  try {
    const { judul, isi } = req.body;

    // Validasi
    if (!judul || !isi) {
      return res.status(400).json({
        success: false,
        message: "Judul dan isi harus diisi",
      });
    }

    // Handle foto upload
    let fotoPath = null;
    if (req.file) {
      fotoPath = `/uploads/rekam-jejak/${req.file.filename}`;
    }

    const rekamJejak = await RekamJejak.create({
      judul,
      isi,
      foto: fotoPath,
    });

    res.status(201).json({
      success: true,
      message: "Rekam jejak berhasil dibuat",
      data: rekamJejak,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update rekamJejak
 */
const updateRekamJejak = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { judul, isi } = req.body;

    const rekamJejak = await RekamJejak.findByPk(id);

    if (!rekamJejak) {
      return res.status(404).json({
        success: false,
        message: "Rekam jejak tidak ditemukan",
      });
    }

    // Update fields
    if (judul) rekamJejak.judul = judul;
    if (isi) rekamJejak.isi = isi;

    // Handle foto upload
    if (req.file) {
      // Hapus foto lama jika ada
      if (rekamJejak.foto) {
        const oldFotoPath = path.join(
          __dirname,
          "../../public",
          rekamJejak.foto
        );
        if (fs.existsSync(oldFotoPath)) {
          fs.unlinkSync(oldFotoPath);
        }
      }
      // Simpan path foto baru
      rekamJejak.foto = `/uploads/rekam-jejak/${req.file.filename}`;
    }

    await rekamJejak.save();

    res.status(200).json({
      success: true,
      message: "Rekam jejak berhasil diupdate",
      data: rekamJejak,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete rekamJejak
 */
const deleteRekamJejak = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rekamJejak = await RekamJejak.findByPk(id);

    if (!rekamJejak) {
      return res.status(404).json({
        success: false,
        message: "Rekam jejak tidak ditemukan",
      });
    }

    // Hapus foto dari server
    if (rekamJejak.foto) {
      const fotoPath = path.join(__dirname, "../../public", rekamJejak.foto);
      if (fs.existsSync(fotoPath)) {
        fs.unlinkSync(fotoPath);
      }
    }

    await rekamJejak.destroy();

    res.status(200).json({
      success: true,
      message: "Rekam jejak berhasil dihapus",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRekamJejak,
  getRekamJejakById,
  createRekamJejak,
  updateRekamJejak,
  deleteRekamJejak,
};
