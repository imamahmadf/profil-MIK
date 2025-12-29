const { Galeri } = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

/**
 * Get all galeri dengan pagination dan search
 */
const getAllGaleri = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const where = {};
    if (search) {
      where[Op.or] = [
        { judul: { [Op.like]: `%${search}%` } },
        { keterangan: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Galeri.findAndCountAll({
      where,
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
    console.error("Error in getAllGaleri:", error);
    next(error);
  }
};

/**
 * Get galeri by ID
 */
const getGaleriById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const galeri = await Galeri.findByPk(id);

    if (!galeri) {
      return res.status(404).json({
        success: false,
        message: "Galeri tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: galeri,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new galeri
 */
const createGaleri = async (req, res, next) => {
  try {
    const { judul, keterangan } = req.body;

    // Validasi
    if (!judul) {
      return res.status(400).json({
        success: false,
        message: "Judul harus diisi",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Foto harus diupload",
      });
    }

    const fotoPath = `/uploads/galeri/${req.file.filename}`;

    const galeri = await Galeri.create({
      judul,
      foto: fotoPath,
      keterangan: keterangan || null,
    });

    res.status(201).json({
      success: true,
      message: "Galeri berhasil dibuat",
      data: galeri,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update galeri
 */
const updateGaleri = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { judul, keterangan } = req.body;

    const galeri = await Galeri.findByPk(id);

    if (!galeri) {
      return res.status(404).json({
        success: false,
        message: "Galeri tidak ditemukan",
      });
    }

    // Update fields
    if (judul) galeri.judul = judul;
    if (keterangan !== undefined) galeri.keterangan = keterangan;

    // Handle foto upload
    if (req.file) {
      // Hapus foto lama jika ada
      if (galeri.foto) {
        const oldFotoPath = path.join(__dirname, "../../public", galeri.foto);
        if (fs.existsSync(oldFotoPath)) {
          fs.unlinkSync(oldFotoPath);
        }
      }
      // Simpan path foto baru
      galeri.foto = `/uploads/galeri/${req.file.filename}`;
    }

    await galeri.save();

    res.status(200).json({
      success: true,
      message: "Galeri berhasil diupdate",
      data: galeri,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete galeri
 */
const deleteGaleri = async (req, res, next) => {
  try {
    const { id } = req.params;

    const galeri = await Galeri.findByPk(id);

    if (!galeri) {
      return res.status(404).json({
        success: false,
        message: "Galeri tidak ditemukan",
      });
    }

    // Hapus foto dari server
    if (galeri.foto) {
      const fotoPath = path.join(__dirname, "../../public", galeri.foto);
      if (fs.existsSync(fotoPath)) {
        fs.unlinkSync(fotoPath);
      }
    }

    await galeri.destroy();

    res.status(200).json({
      success: true,
      message: "Galeri berhasil dihapus",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllGaleri,
  getGaleriById,
  createGaleri,
  updateGaleri,
  deleteGaleri,
};
