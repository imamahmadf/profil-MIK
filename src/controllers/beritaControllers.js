const {
  Berita,
  BeritaTranslation,
  Language,
  FotoBerita,
} = require("../models");
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
    const lang = req.query.lang || req.language?.code || "id";

    // Get language ID
    const language = await Language.findOne({ where: { code: lang } });
    if (!language) {
      return res.status(400).json({
        success: false,
        message: "Bahasa tidak ditemukan",
      });
    }

    // Jika user authenticated (admin), tampilkan semua berita (termasuk yang belum published)
    // Jika tidak authenticated (public), hanya tampilkan yang published
    const where = req.user ? {} : { is_published: true };
    const translationWhere = { language_id: language.id };

    if (search) {
      translationWhere[Op.or] = [
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
          model: BeritaTranslation,
          as: "translations",
          where: translationWhere,
          required: false, // Changed to false untuk fallback ke default language
        },
        {
          model: FotoBerita,
          as: "fotos",
          separate: true,
          order: [["urutan", "ASC"]],
        },
      ],
      distinct: true,
    });

    // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
    const defaultLanguage = await Language.findOne({
      where: { is_default: true },
    });

    // Format response dengan fallback ke default language
    const formattedData = await Promise.all(
      rows.map(async (berita) => {
        let translation = berita.translations?.[0];

        // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
        if (!translation && defaultLanguage) {
          const defaultTranslation = await BeritaTranslation.findOne({
            where: {
              berita_id: berita.id,
              language_id: defaultLanguage.id,
            },
          });
          if (defaultTranslation) {
            translation = defaultTranslation;
          }
        }

        return {
          id: berita.id,
          slug: berita.slug || translation?.slug,
          foto: berita.foto,
          is_published: berita.is_published,
          judul: translation?.judul || "No translation available",
          isi: translation?.isi || "",
          meta_title: translation?.meta_title,
          meta_description: translation?.meta_description,
          language: lang,
          fotos: berita.fotos,
          createdAt: berita.createdAt,
          updatedAt: berita.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: formattedData,
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
    const lang = req.query.lang || req.language?.code || "id";

    // Get language ID
    const language = await Language.findOne({ where: { code: lang } });
    if (!language) {
      return res.status(400).json({
        success: false,
        message: "Bahasa tidak ditemukan",
      });
    }

    const berita = await Berita.findByPk(id, {
      include: [
        {
          model: BeritaTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
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

    // Format response
    const formattedData = {
      id: berita.id,
      slug: berita.slug || berita.translations[0]?.slug,
      foto: berita.foto,
      is_published: berita.is_published,
      judul: berita.translations[0]?.judul,
      isi: berita.translations[0]?.isi,
      meta_title: berita.translations[0]?.meta_title,
      meta_description: berita.translations[0]?.meta_description,
      language: lang,
      fotos: berita.fotos,
      createdAt: berita.createdAt,
      updatedAt: berita.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedData,
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
    const lang = req.query.lang || req.language?.code || "id";

    // Get language ID
    const language = await Language.findOne({ where: { code: lang } });
    if (!language) {
      return res.status(400).json({
        success: false,
        message: "Bahasa tidak ditemukan",
      });
    }

    // Cari berita berdasarkan slug di tabel utama atau translation
    let berita = await Berita.findOne({
      where: { slug },
      include: [
        {
          model: BeritaTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
        {
          model: FotoBerita,
          as: "fotos",
          separate: true,
          order: [["urutan", "ASC"]],
        },
      ],
    });

    // Jika tidak ditemukan di tabel utama, cari di translation
    if (!berita) {
      const translation = await BeritaTranslation.findOne({
        where: { slug, language_id: language.id },
        include: [
          {
            model: Berita,
            as: "berita",
            include: [
              {
                model: FotoBerita,
                as: "fotos",
                separate: true,
                order: [["urutan", "ASC"]],
              },
            ],
          },
        ],
      });

      if (translation && translation.berita) {
        berita = translation.berita;
        berita.translations = [translation];
      }
    }

    if (!berita) {
      return res.status(404).json({
        success: false,
        message: "Berita tidak ditemukan",
      });
    }

    // Format response
    const formattedData = {
      id: berita.id,
      slug: berita.slug || berita.translations[0]?.slug,
      foto: berita.foto,
      is_published: berita.is_published,
      judul: berita.translations[0]?.judul,
      isi: berita.translations[0]?.isi,
      meta_title: berita.translations[0]?.meta_title,
      meta_description: berita.translations[0]?.meta_description,
      language: lang,
      fotos: berita.fotos,
      createdAt: berita.createdAt,
      updatedAt: berita.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedData,
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
    const { translations, slug, foto } = req.body;

    // Validasi: minimal harus ada terjemahan untuk bahasa default
    const defaultLang = await Language.findOne({ where: { is_default: true } });
    if (!defaultLang) {
      return res.status(400).json({
        success: false,
        message: "Bahasa default tidak ditemukan",
      });
    }

    // Parse translations jika dikirim sebagai JSON string (dari FormData)
    let finalTranslations = translations;
    if (typeof finalTranslations === "string") {
      try {
        finalTranslations = JSON.parse(finalTranslations);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Format translations tidak valid",
        });
      }
    }

    // Support backward compatibility: jika masih menggunakan format lama (judul, isi)
    if (!finalTranslations && req.body.judul && req.body.isi) {
      finalTranslations = [
        {
          language_code: defaultLang.code,
          judul: req.body.judul,
          isi: req.body.isi,
        },
      ];
    }

    // Validasi bahwa finalTranslations adalah array
    if (!Array.isArray(finalTranslations) || finalTranslations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Terjemahan harus diisi",
      });
    }

    const hasDefaultTranslation = finalTranslations.some(
      (t) => t.language_code === defaultLang.code
    );
    if (!hasDefaultTranslation) {
      return res.status(400).json({
        success: false,
        message: `Terjemahan untuk bahasa default (${defaultLang.code}) wajib diisi`,
      });
    }

    // Generate slug jika tidak ada
    let finalSlug = slug;
    if (!finalSlug && finalTranslations.length > 0) {
      const defaultTranslation = finalTranslations.find(
        (t) => t.language_code === defaultLang.code
      );
      if (defaultTranslation?.judul) {
        finalSlug = defaultTranslation.judul
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
    }

    // Cek apakah slug sudah ada
    const existingBerita = await Berita.findOne({ where: { slug: finalSlug } });
    if (existingBerita) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    // Handle foto utama
    let fotoPath = foto || null;
    if (req.file) {
      fotoPath = `/uploads/berita/${req.file.filename}`;
    }

    // Create berita
    const berita = await Berita.create({
      slug: finalSlug,
      foto: fotoPath,
      is_published: true,
    });

    // Create translations
    const translationPromises = finalTranslations.map(async (trans) => {
      const language = await Language.findOne({
        where: { code: trans.language_code },
      });
      if (!language) return null;

      return BeritaTranslation.create({
        berita_id: berita.id,
        language_id: language.id,
        judul: trans.judul,
        isi: trans.isi,
        slug: trans.slug || finalSlug,
        meta_title: trans.meta_title,
        meta_description: trans.meta_description,
      });
    });

    await Promise.all(translationPromises.filter(Boolean));

    // Handle multiple foto upload
    if (req.files && req.files.length > 0) {
      const fotoData = req.files.map((file, index) => ({
        beritaId: berita.id,
        foto: `/uploads/berita/${file.filename}`,
        urutan: index + 1,
      }));

      await FotoBerita.bulkCreate(fotoData);
    }

    // Reload berita dengan translations dan fotos
    const beritaWithData = await Berita.findByPk(berita.id, {
      include: [
        {
          model: BeritaTranslation,
          as: "translations",
          include: [
            {
              model: Language,
              as: "language",
            },
          ],
        },
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
      data: beritaWithData,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Slug sudah digunakan",
      });
    }
    console.error("Error in createBerita:", error);
    next(error);
  }
};

/**
 * Update berita
 */
const updateBerita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { translations, slug, foto, is_published } = req.body;

    const berita = await Berita.findByPk(id);

    if (!berita) {
      return res.status(404).json({
        success: false,
        message: "Berita tidak ditemukan",
      });
    }

    // Update slug jika ada
    if (slug !== undefined) {
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
    }

    // Update foto jika ada
    if (foto !== undefined) {
      berita.foto = foto;
    }

    // Update is_published jika ada
    if (is_published !== undefined) {
      berita.is_published = is_published;
    }

    // Handle foto utama upload
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

    await berita.save();

    // Parse translations jika dikirim sebagai JSON string (dari FormData)
    let parsedTranslations = translations;
    if (translations) {
      if (typeof translations === "string") {
        try {
          parsedTranslations = JSON.parse(translations);
        } catch (parseError) {
          return res.status(400).json({
            success: false,
            message: "Format translations tidak valid",
          });
        }
      }

      // Support backward compatibility: jika masih menggunakan format lama (judul, isi)
      if (!parsedTranslations && req.body.judul) {
        const defaultLang = await Language.findOne({
          where: { is_default: true },
        });
        if (defaultLang) {
          parsedTranslations = [
            {
              language_code: defaultLang.code,
              judul: req.body.judul,
              isi: req.body.isi || "",
            },
          ];
        }
      }

      // Update translations jika ada
      if (
        parsedTranslations &&
        Array.isArray(parsedTranslations) &&
        parsedTranslations.length > 0
      ) {
        for (const trans of parsedTranslations) {
          const language = await Language.findOne({
            where: { code: trans.language_code },
          });
          if (!language) continue;

          // Cari translation yang sudah ada
          const existingTranslation = await BeritaTranslation.findOne({
            where: {
              berita_id: berita.id,
              language_id: language.id,
            },
          });

          if (existingTranslation) {
            // Update translation yang sudah ada
            if (trans.judul) existingTranslation.judul = trans.judul;
            if (trans.isi) existingTranslation.isi = trans.isi;
            if (trans.slug !== undefined) existingTranslation.slug = trans.slug;
            if (trans.meta_title !== undefined)
              existingTranslation.meta_title = trans.meta_title;
            if (trans.meta_description !== undefined)
              existingTranslation.meta_description = trans.meta_description;
            await existingTranslation.save();
          } else {
            // Buat translation baru
            await BeritaTranslation.create({
              berita_id: berita.id,
              language_id: language.id,
              judul: trans.judul,
              isi: trans.isi,
              slug: trans.slug || berita.slug,
              meta_title: trans.meta_title,
              meta_description: trans.meta_description,
            });
          }
        }
      }
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

    // Reload berita dengan translations dan fotos
    const beritaWithData = await Berita.findByPk(berita.id, {
      include: [
        {
          model: BeritaTranslation,
          as: "translations",
          include: [
            {
              model: Language,
              as: "language",
            },
          ],
        },
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
      data: beritaWithData,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Slug sudah digunakan",
      });
    }
    console.error("Error in updateBerita:", error);
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
