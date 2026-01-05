const { Pesan } = require("../models");
const { Op } = require("sequelize");

/**
 * Get all pesan dengan pagination dan filter
 */
const getAllPesan = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search || "";

    const where = {};
    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { nama: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { judul: { [Op.like]: `%${search}%` } },
        { pesan: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Pesan.findAndCountAll({
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
    console.error("Error in getAllPesan:", error);
    next(error);
  }
};

/**
 * Get pesan by ID
 */
const getPesanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pesan = await Pesan.findByPk(id);

    if (!pesan) {
      return res.status(404).json({
        success: false,
        message: "Pesan tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: pesan,
    });
  } catch (error) {
    console.error("Error in getPesanById:", error);
    next(error);
  }
};

/**
 * Create new pesan (public endpoint untuk contact form)
 */
const createPesan = async (req, res, next) => {
  try {
    const { nama, email, kontak, judul, pesan } = req.body;

    // Validasi required fields
    if (!nama || !email || !pesan) {
      return res.status(400).json({
        success: false,
        message: "Nama, email, dan pesan harus diisi",
      });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Format email tidak valid",
      });
    }

    // Create pesan dengan status default "new"
    const newPesan = await Pesan.create({
      nama,
      email,
      kontak: kontak || null,
      judul: judul || null,
      pesan,
      status: "new",
    });

    res.status(201).json({
      success: true,
      message: "Pesan berhasil dikirim",
      data: newPesan,
    });
  } catch (error) {
    console.error("Error in createPesan:", error);
    next(error);
  }
};

/**
 * Update pesan (untuk update status, biasanya oleh admin)
 */
const updatePesan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, nama, email, kontak, judul, pesan } = req.body;

    const pesanData = await Pesan.findByPk(id);

    if (!pesanData) {
      return res.status(404).json({
        success: false,
        message: "Pesan tidak ditemukan",
      });
    }

    // Update fields jika ada
    if (status !== undefined) {
      // Validasi status
      const validStatuses = ["new", "read", "replied"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status harus salah satu dari: ${validStatuses.join(", ")}`,
        });
      }
      pesanData.status = status;
    }

    if (nama !== undefined) pesanData.nama = nama;
    if (email !== undefined) {
      // Validasi format email jika email diupdate
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Format email tidak valid",
        });
      }
      pesanData.email = email;
    }
    if (kontak !== undefined) pesanData.kontak = kontak;
    if (judul !== undefined) pesanData.judul = judul;
    if (pesan !== undefined) pesanData.pesan = pesan;

    await pesanData.save();

    res.status(200).json({
      success: true,
      message: "Pesan berhasil diupdate",
      data: pesanData,
    });
  } catch (error) {
    console.error("Error in updatePesan:", error);
    next(error);
  }
};

/**
 * Delete pesan
 */
const deletePesan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pesan = await Pesan.findByPk(id);

    if (!pesan) {
      return res.status(404).json({
        success: false,
        message: "Pesan tidak ditemukan",
      });
    }

    await pesan.destroy();

    res.status(200).json({
      success: true,
      message: "Pesan berhasil dihapus",
    });
  } catch (error) {
    console.error("Error in deletePesan:", error);
    next(error);
  }
};

/**
 * Mark pesan as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pesan = await Pesan.findByPk(id);

    if (!pesan) {
      return res.status(404).json({
        success: false,
        message: "Pesan tidak ditemukan",
      });
    }

    pesan.status = "read";
    await pesan.save();

    res.status(200).json({
      success: true,
      message: "Pesan ditandai sebagai sudah dibaca",
      data: pesan,
    });
  } catch (error) {
    console.error("Error in markAsRead:", error);
    next(error);
  }
};

/**
 * Mark pesan as replied
 */
const markAsReplied = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pesan = await Pesan.findByPk(id);

    if (!pesan) {
      return res.status(404).json({
        success: false,
        message: "Pesan tidak ditemukan",
      });
    }

    pesan.status = "replied";
    await pesan.save();

    res.status(200).json({
      success: true,
      message: "Pesan ditandai sebagai sudah dibalas",
      data: pesan,
    });
  } catch (error) {
    console.error("Error in markAsReplied:", error);
    next(error);
  }
};

module.exports = {
  getAllPesan,
  getPesanById,
  createPesan,
  updatePesan,
  deletePesan,
  markAsRead,
  markAsReplied,
};
