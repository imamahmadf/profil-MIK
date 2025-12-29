const { Berita, FotoBerita } = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

/**
 * Get all berita dengan pagination dan search
 */
const getAllBerita = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const where = {};
    if (search) {
      where[Op.or] = [
        { judul: { [Op.like]: `%${search}%` } },
        { isi: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Berita.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: FotoBerita,
          as: "fotos",
          separate: true,
          order: [["urutan", "ASC"]],
        },
      ],
      raw: false,
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
    console.error("Error in getAllBerita:", error);
    next(error);
  }
};

/**
 * Get berita by ID
 */
const getBeritaById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const berita = await Berita.findByPk(id, {
      include: [
        {
          model: FotoBerita,
          as: "fotos",
          separate: true,
          order: [["urutan", "ASC"]],
        },
      ],
    });

    if (!berita) {
      return res.status(404).json({
        success: false,
        message: "Berita tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: berita,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get berita by slug
 */
const getBeritaBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const berita = await Berita.findOne({
      where: { slug },
      include: [
        {
          model: FotoBerita,
          as: "fotos",
          separate: true,
          order: [["urutan", "ASC"]],
        },
      ],
    });

    if (!berita) {
      return res.status(404).json({
        success: false,
        message: "Berita tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: berita,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new berita
 */
const createBerita = async (req, res, next) => {
  try {
    const { judul, isi, slug } = req.body;

    // Validasi
    if (!judul || !isi) {
      return res.status(400).json({
        success: false,
        message: "Judul dan isi harus diisi",
      });
    }

    // Generate slug dari judul jika tidak ada
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = judul
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    // Cek apakah slug sudah ada
    const existingBerita = await Berita.findOne({ where: { slug: finalSlug } });
    if (existingBerita) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    // Handle foto utama (untuk backward compatibility)
    let fotoPath = null;
    if (req.file) {
      fotoPath = `/uploads/berita/${req.file.filename}`;
    }

    const berita = await Berita.create({
      judul,
      isi,
      slug: finalSlug,
      foto: fotoPath,
    });

    // Handle multiple foto upload
    if (req.files && req.files.length > 0) {
      const fotoData = req.files.map((file, index) => ({
        beritaId: berita.id,
        foto: `/uploads/berita/${file.filename}`,
        urutan: index + 1,
      }));

      await FotoBerita.bulkCreate(fotoData);
    }

    // Reload berita dengan fotos
    const beritaWithFotos = await Berita.findByPk(berita.id, {
      include: [
        {
          model: FotoBerita,
          as: "fotos",
          separate: true,
          order: [["urutan", "ASC"]],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Berita berhasil dibuat",
      data: beritaWithFotos,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Slug sudah digunakan",
      });
    }
    next(error);
  }
};

/**
 * Update berita
 */
const updateBerita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { judul, isi, slug } = req.body;

    const berita = await Berita.findByPk(id);

    if (!berita) {
      return res.status(404).json({
        success: false,
        message: "Berita tidak ditemukan",
      });
    }

    // Update fields
    if (judul) berita.judul = judul;
    if (isi) berita.isi = isi;
    if (slug) {
      // Cek apakah slug sudah digunakan oleh berita lain
      const existingBerita = await Berita.findOne({
        where: { slug, id: { [Op.ne]: id } },
      });
      if (existingBerita) {
        return res.status(400).json({
          success: false,
          message: "Slug sudah digunakan",
        });
      }
      berita.slug = slug;
    } else if (judul) {
      // Generate slug baru dari judul jika slug tidak diupdate tapi judul diupdate
      const newSlug = judul
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const existingBerita = await Berita.findOne({
        where: { slug: newSlug, id: { [Op.ne]: id } },
      });
      berita.slug = existingBerita ? `${newSlug}-${Date.now()}` : newSlug;
    }

    // Handle foto utama upload (untuk backward compatibility)
    if (req.file) {
      // Hapus foto lama jika ada
      if (berita.foto) {
        const oldFotoPath = path.join(__dirname, "../../public", berita.foto);
        if (fs.existsSync(oldFotoPath)) {
          fs.unlinkSync(oldFotoPath);
        }
      }
      // Simpan path foto baru
      berita.foto = `/uploads/berita/${req.file.filename}`;
    }

    // Handle multiple foto upload
    if (req.files && req.files.length > 0) {
      // Get urutan terakhir
      const lastFoto = await FotoBerita.findOne({
        where: { beritaId: berita.id },
        order: [["urutan", "DESC"]],
      });
      let startUrutan = lastFoto ? lastFoto.urutan + 1 : 1;

      const fotoData = req.files.map((file, index) => ({
        beritaId: berita.id,
        foto: `/uploads/berita/${file.filename}`,
        urutan: startUrutan + index,
      }));

      await FotoBerita.bulkCreate(fotoData);
    }

    await berita.save();

    // Reload berita dengan fotos
    const beritaWithFotos = await Berita.findByPk(berita.id, {
      include: [
        {
          model: FotoBerita,
          as: "fotos",
          separate: true,
          order: [["urutan", "ASC"]],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Berita berhasil diupdate",
      data: beritaWithFotos,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Slug sudah digunakan",
      });
    }
    next(error);
  }
};

/**
 * Delete berita
 */
const deleteBerita = async (req, res, next) => {
  try {
    const { id } = req.params;

    const berita = await Berita.findByPk(id);

    if (!berita) {
      return res.status(404).json({
        success: false,
        message: "Berita tidak ditemukan",
      });
    }

    // Hapus semua foto berita dari tabel foto_berita
    const fotos = await FotoBerita.findAll({
      where: { beritaId: berita.id },
    });

    // Hapus file foto dari server
    for (const foto of fotos) {
      const fotoPath = path.join(__dirname, "../../public", foto.foto);
      if (fs.existsSync(fotoPath)) {
        fs.unlinkSync(fotoPath);
      }
    }

    // Hapus foto utama jika ada
    if (berita.foto) {
      const fotoPath = path.join(__dirname, "../../public", berita.foto);
      if (fs.existsSync(fotoPath)) {
        fs.unlinkSync(fotoPath);
      }
    }

    // Hapus semua record foto dari database
    await FotoBerita.destroy({
      where: { beritaId: berita.id },
    });

    await berita.destroy();

    res.status(200).json({
      success: true,
      message: "Berita berhasil dihapus",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBerita,
  getBeritaById,
  getBeritaBySlug,
  createBerita,
  updateBerita,
  deleteBerita,
};
