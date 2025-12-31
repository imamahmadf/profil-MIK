const { RekamJejak, RekamJejakTranslation, Language } = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

/**
 * Helper function untuk memvalidasi dan mendapatkan bahasa
 * Mendukung case-insensitive dan trim
 */
const validateAndGetLanguage = async (languageCode) => {
  if (!languageCode) {
    return { error: "Language code tidak boleh kosong" };
  }

  // Normalize: trim dan lowercase
  const normalizedCode = languageCode.trim().toLowerCase();

  const language = await Language.findOne({
    where: {
      code: normalizedCode,
      is_active: true,
    },
  });

  if (!language) {
    // Cek apakah bahasa ada tapi tidak aktif
    const inactiveLanguage = await Language.findOne({
      where: { code: normalizedCode },
    });

    if (inactiveLanguage) {
      return {
        error: `Bahasa dengan code '${languageCode}' ditemukan tapi tidak aktif. Silakan aktifkan bahasa tersebut terlebih dahulu.`,
      };
    }

    return {
      error: `Bahasa dengan code '${languageCode}' tidak ditemukan di database. Pastikan bahasa sudah terdaftar dengan code yang benar (contoh: 'ru' untuk Russian, 'id' untuk Indonesian).`,
    };
  }

  return { language };
};

/**
 * Get all rekamJejak dengan pagination dan search
 */
const getAllRekamJejak = async (req, res, next) => {
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

    const translationWhere = { language_id: language.id };

    if (search) {
      translationWhere[Op.or] = [
        { judul: { [Op.like]: `%${search}%` } },
        { isi: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await RekamJejak.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: RekamJejakTranslation,
          as: "translations",
          where: translationWhere,
          required: false, // Changed to false untuk fallback ke default language
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
      rows.map(async (rekamJejak) => {
        let translation = rekamJejak.translations?.[0];

        // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
        if (!translation && defaultLanguage) {
          const defaultTranslation = await RekamJejakTranslation.findOne({
            where: {
              rekam_jejak_id: rekamJejak.id,
              language_id: defaultLanguage.id,
            },
          });
          if (defaultTranslation) {
            translation = defaultTranslation;
          }
        }

        return {
          id: rekamJejak.id,
          slug: translation?.slug,
          foto: rekamJejak.foto,
          judul: translation?.judul || "No translation available",
          isi: translation?.isi || "",
          meta_title: translation?.meta_title,
          meta_description: translation?.meta_description,
          language: lang,
          createdAt: rekamJejak.createdAt,
          updatedAt: rekamJejak.updatedAt,
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
    const lang = req.query.lang || req.language?.code || "id";

    // Get language ID
    const language = await Language.findOne({ where: { code: lang } });
    if (!language) {
      return res.status(400).json({
        success: false,
        message: "Bahasa tidak ditemukan",
      });
    }

    const rekamJejak = await RekamJejak.findByPk(id, {
      include: [
        {
          model: RekamJejakTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
      ],
    });

    if (!rekamJejak) {
      return res.status(404).json({
        success: false,
        message: "Rekam jejak tidak ditemukan",
      });
    }

    // Format response
    const formattedData = {
      id: rekamJejak.id,
      slug: rekamJejak.translations[0]?.slug,
      foto: rekamJejak.foto,
      judul: rekamJejak.translations[0]?.judul,
      isi: rekamJejak.translations[0]?.isi,
      meta_title: rekamJejak.translations[0]?.meta_title,
      meta_description: rekamJejak.translations[0]?.meta_description,
      language: lang,
      createdAt: rekamJejak.createdAt,
      updatedAt: rekamJejak.updatedAt,
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
 * Create new rekamJejak
 */
const createRekamJejak = async (req, res, next) => {
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

    // Generate slug jika tidak ada (hanya untuk translations)
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

    // Cek apakah slug sudah ada di translations (bukan di tabel utama)
    if (finalSlug) {
      const existingTranslation = await RekamJejakTranslation.findOne({
        where: { slug: finalSlug },
        include: [
          {
            model: RekamJejak,
            as: "rekamJejak",
          },
        ],
      });
      if (existingTranslation) {
        finalSlug = `${finalSlug}-${Date.now()}`;
      }
    }

    // Handle foto upload
    let fotoPath = foto || null;
    if (req.file) {
      fotoPath = `/uploads/rekam-jejak/${req.file.filename}`;
    }

    // Create rekam jejak (tanpa slug, karena slug hanya di translations)
    const rekamJejak = await RekamJejak.create({
      foto: fotoPath,
    });

    // Create translations dengan validasi yang lebih baik
    const translationResults = [];
    const errors = [];

    for (const trans of finalTranslations) {
      // Validasi bahasa dengan helper function
      const { language, error } = await validateAndGetLanguage(
        trans.language_code
      );

      if (error) {
        console.error(
          `Error validating language '${trans.language_code}':`,
          error
        );
        errors.push(error);
        continue;
      }

      console.log(
        `Creating translation for language: ${trans.language_code} (ID: ${language.id})`
      );

      try {
        const translation = await RekamJejakTranslation.create({
          rekam_jejak_id: rekamJejak.id,
          language_id: language.id,
          judul: trans.judul,
          isi: trans.isi,
          slug: trans.slug || finalSlug,
          meta_title: trans.meta_title,
          meta_description: trans.meta_description,
        });
        translationResults.push(translation);
      } catch (error) {
        console.error(
          `Error creating translation for language ${trans.language_code}:`,
          error
        );
        errors.push(
          `Gagal menyimpan terjemahan untuk bahasa '${trans.language_code}': ${error.message}`
        );
      }
    }

    // Jika ada error, kembalikan error yang jelas
    if (errors.length > 0) {
      // Hapus rekam jejak yang sudah dibuat jika ada error
      await rekamJejak.destroy();
      return res.status(400).json({
        success: false,
        message: "Gagal menyimpan beberapa terjemahan",
        errors: errors,
      });
    }

    // Reload rekam jejak dengan translations
    const rekamJejakWithData = await RekamJejak.findByPk(rekamJejak.id, {
      include: [
        {
          model: RekamJejakTranslation,
          as: "translations",
          include: [
            {
              model: Language,
              as: "language",
            },
          ],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Rekam jejak berhasil dibuat",
      data: rekamJejakWithData,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Slug sudah digunakan",
      });
    }
    console.error("Error in createRekamJejak:", error);
    next(error);
  }
};

/**
 * Update rekamJejak
 */
const updateRekamJejak = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { translations, slug, foto } = req.body;

    const rekamJejak = await RekamJejak.findByPk(id);

    if (!rekamJejak) {
      return res.status(404).json({
        success: false,
        message: "Rekam jejak tidak ditemukan",
      });
    }

    // Update foto jika ada
    if (foto !== undefined) {
      rekamJejak.foto = foto;
    }

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
        // Ambil default translation untuk fallback slug
        const defaultLang = await Language.findOne({
          where: { is_default: true },
        });
        let defaultSlug = null;
        if (defaultLang) {
          const defaultTranslation = await RekamJejakTranslation.findOne({
            where: {
              rekam_jejak_id: rekamJejak.id,
              language_id: defaultLang.id,
            },
          });
          defaultSlug = defaultTranslation?.slug;
        }

        for (const trans of parsedTranslations) {
          // Validasi bahasa dengan helper function
          const { language, error } = await validateAndGetLanguage(
            trans.language_code
          );

          if (error) {
            console.warn(error);
            continue;
          }

          // Cari translation yang sudah ada
          const existingTranslation = await RekamJejakTranslation.findOne({
            where: {
              rekam_jejak_id: rekamJejak.id,
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
            await RekamJejakTranslation.create({
              rekam_jejak_id: rekamJejak.id,
              language_id: language.id,
              judul: trans.judul,
              isi: trans.isi,
              slug: trans.slug || defaultSlug,
              meta_title: trans.meta_title,
              meta_description: trans.meta_description,
            });
          }
        }
      }
    }

    // Reload rekam jejak dengan translations
    const rekamJejakWithData = await RekamJejak.findByPk(rekamJejak.id, {
      include: [
        {
          model: RekamJejakTranslation,
          as: "translations",
          include: [
            {
              model: Language,
              as: "language",
            },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Rekam jejak berhasil diupdate",
      data: rekamJejakWithData,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Slug sudah digunakan",
      });
    }
    console.error("Error in updateRekamJejak:", error);
    next(error);
  }
};

/**
 * Get rekamJejak by slug
 */
const getRekamJejakBySlug = async (req, res, next) => {
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

    // Cari rekam jejak berdasarkan slug di translation (slug hanya ada di translations)
    const translation = await RekamJejakTranslation.findOne({
      where: { slug, language_id: language.id },
      include: [
        {
          model: RekamJejak,
          as: "rekamJejak",
        },
      ],
    });

    let rekamJejak = null;
    if (translation && translation.rekamJejak) {
      rekamJejak = translation.rekamJejak;
      rekamJejak.translations = [translation];
    }

    if (!rekamJejak) {
      return res.status(404).json({
        success: false,
        message: "Rekam jejak tidak ditemukan",
      });
    }

    // Format response
    const formattedData = {
      id: rekamJejak.id,
      slug: rekamJejak.translations[0]?.slug,
      foto: rekamJejak.foto,
      judul: rekamJejak.translations[0]?.judul,
      isi: rekamJejak.translations[0]?.isi,
      meta_title: rekamJejak.translations[0]?.meta_title,
      meta_description: rekamJejak.translations[0]?.meta_description,
      language: lang,
      createdAt: rekamJejak.createdAt,
      updatedAt: rekamJejak.updatedAt,
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
  getRekamJejakBySlug,
  createRekamJejak,
  updateRekamJejak,
  deleteRekamJejak,
};
