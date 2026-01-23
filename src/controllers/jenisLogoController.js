const { JenisLogo } = require("../models");
const { Op } = require("sequelize");

/**
 * Get all jenis logo
 */
const getAllJenisLogo = async (req, res, next) => {
  try {
    const jenisLogos = await JenisLogo.findAll({
      order: [["nama", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: jenisLogos,
    });
  } catch (error) {
    console.error("Error in getAllJenisLogo:", error);
    next(error);
  }
};

/**
 * Get jenis logo by ID
 */
const getJenisLogoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const jenisLogo = await JenisLogo.findByPk(id, {
      include: [
        {
          association: "logos",
          attributes: ["id", "gambarLogo", "createdAt"],
        },
      ],
    });

    if (!jenisLogo) {
      return res.status(404).json({
        success: false,
        message: "Jenis Logo tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: jenisLogo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new jenis logo
 */
const createJenisLogo = async (req, res, next) => {
  try {
    const { nama } = req.body;

    // Validasi
    if (!nama) {
      return res.status(400).json({
        success: false,
        message: "Nama jenis logo harus diisi",
      });
    }

    const jenisLogo = await JenisLogo.create({
      nama,
    });

    res.status(201).json({
      success: true,
      message: "Jenis Logo berhasil dibuat",
      data: jenisLogo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update jenis logo
 */
const updateJenisLogo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nama } = req.body;

    const jenisLogo = await JenisLogo.findByPk(id);

    if (!jenisLogo) {
      return res.status(404).json({
        success: false,
        message: "Jenis Logo tidak ditemukan",
      });
    }

    // Update nama jika diberikan
    if (nama) {
      jenisLogo.nama = nama;
    }

    await jenisLogo.save();

    res.status(200).json({
      success: true,
      message: "Jenis Logo berhasil diupdate",
      data: jenisLogo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete jenis logo
 */
const deleteJenisLogo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const jenisLogo = await JenisLogo.findByPk(id);

    if (!jenisLogo) {
      return res.status(404).json({
        success: false,
        message: "Jenis Logo tidak ditemukan",
      });
    }

    await jenisLogo.destroy();

    res.status(200).json({
      success: true,
      message: "Jenis Logo berhasil dihapus",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllJenisLogo,
  getJenisLogoById,
  createJenisLogo,
  updateJenisLogo,
  deleteJenisLogo,
};

