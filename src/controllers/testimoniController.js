const { Testimoni, TestimoniTranslation, Language } = require("../models");
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
 * Get all testimoni dengan pagination
 */
const getAllTestimoni = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const lang = req.query.lang || req.language?.code || "id";

    // Get language ID
    const { language, error } = await validateAndGetLanguage(lang);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const { count, rows } = await Testimoni.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: TestimoniTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
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
      rows.map(async (testimoni) => {
        let translation = testimoni.translations?.[0];

        // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
        if (!translation && defaultLanguage) {
          const defaultTranslation = await TestimoniTranslation.findOne({
            where: {
              testimoni_id: testimoni.id,
              language_id: defaultLanguage.id,
            },
          });
          if (defaultTranslation) {
            translation = defaultTranslation;
          }
        }

        return {
          id: testimoni.id,
          foto: testimoni.foto,
          nama: translation?.nama || "No translation available",
          isi: translation?.isi || "",
          tempat: translation?.tempat || "",
          language: lang,
          createdAt: testimoni.createdAt,
          updatedAt: testimoni.updatedAt,
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
    console.error("Error in getAllTestimoni:", error);
    next(error);
  }
};

/**
 * Get testimoni by ID
 */
const getTestimoniById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lang = req.query.lang || req.language?.code || "id";

    // Get language ID
    const { language, error } = await validateAndGetLanguage(lang);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const testimoni = await Testimoni.findByPk(id, {
      include: [
        {
          model: TestimoniTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
      ],
    });

    if (!testimoni) {
      return res.status(404).json({
        success: false,
        message: "Testimoni tidak ditemukan",
      });
    }

    // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
    let translation = testimoni.translations?.[0];
    if (!translation) {
      const defaultLanguage = await Language.findOne({
        where: { is_default: true },
      });
      if (defaultLanguage) {
        const defaultTranslation = await TestimoniTranslation.findOne({
          where: {
            testimoni_id: testimoni.id,
            language_id: defaultLanguage.id,
          },
        });
        if (defaultTranslation) {
          translation = defaultTranslation;
        }
      }
    }

    // Format response
    const formattedData = {
      id: testimoni.id,
      foto: testimoni.foto,
      nama: translation?.nama || "No translation available",
      isi: translation?.isi || "",
      tempat: translation?.tempat || "",
      language: lang,
      createdAt: testimoni.createdAt,
      updatedAt: testimoni.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getTestimoniById:", error);
    next(error);
  }
};

/**
 * Create new testimoni
 */
const createTestimoni = async (req, res, next) => {
  try {
    const { translations, foto } = req.body;

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

    // Handle foto upload
    let fotoPath = foto || null;
    if (req.file) {
      fotoPath = `/uploads/testimoni/${req.file.filename}`;
    }

    // Create testimoni
    const testimoni = await Testimoni.create({
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
        const translation = await TestimoniTranslation.create({
          testimoni_id: testimoni.id,
          language_id: language.id,
          nama: trans.nama,
          isi: trans.isi,
          tempat: trans.tempat,
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
      // Hapus testimoni yang sudah dibuat jika ada error
      await testimoni.destroy();
      return res.status(400).json({
        success: false,
        message: "Gagal menyimpan beberapa terjemahan",
        errors: errors,
      });
    }

    // Reload testimoni dengan translations
    const testimoniWithData = await Testimoni.findByPk(testimoni.id, {
      include: [
        {
          model: TestimoniTranslation,
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
      message: "Testimoni berhasil dibuat",
      data: testimoniWithData,
    });
  } catch (error) {
    console.error("Error in createTestimoni:", error);
    next(error);
  }
};

/**
 * Update testimoni
 */
const updateTestimoni = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { translations, foto } = req.body;

    const testimoni = await Testimoni.findByPk(id);

    if (!testimoni) {
      return res.status(404).json({
        success: false,
        message: "Testimoni tidak ditemukan",
      });
    }

    // Update foto jika ada
    if (foto !== undefined) {
      testimoni.foto = foto;
    }

    // Handle foto upload
    if (req.file) {
      // Hapus foto lama jika ada
      if (testimoni.foto) {
        const oldFotoPath = path.join(
          __dirname,
          "../../public",
          testimoni.foto
        );
        if (fs.existsSync(oldFotoPath)) {
          fs.unlinkSync(oldFotoPath);
        }
      }
      // Simpan path foto baru
      testimoni.foto = `/uploads/testimoni/${req.file.filename}`;
    }

    await testimoni.save();

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

      // Update translations jika ada
      if (
        parsedTranslations &&
        Array.isArray(parsedTranslations) &&
        parsedTranslations.length > 0
      ) {
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
          const existingTranslation = await TestimoniTranslation.findOne({
            where: {
              testimoni_id: testimoni.id,
              language_id: language.id,
            },
          });

          if (existingTranslation) {
            // Update translation yang sudah ada
            if (trans.nama) existingTranslation.nama = trans.nama;
            if (trans.isi !== undefined) existingTranslation.isi = trans.isi;
            if (trans.tempat !== undefined)
              existingTranslation.tempat = trans.tempat;
            await existingTranslation.save();
          } else {
            // Buat translation baru
            await TestimoniTranslation.create({
              testimoni_id: testimoni.id,
              language_id: language.id,
              nama: trans.nama,
              isi: trans.isi,
              tempat: trans.tempat,
            });
          }
        }
      }
    }

    // Reload testimoni dengan translations
    const testimoniWithData = await Testimoni.findByPk(testimoni.id, {
      include: [
        {
          model: TestimoniTranslation,
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
      message: "Testimoni berhasil diupdate",
      data: testimoniWithData,
    });
  } catch (error) {
    console.error("Error in updateTestimoni:", error);
    next(error);
  }
};

/**
 * Delete testimoni
 */
const deleteTestimoni = async (req, res, next) => {
  try {
    const { id } = req.params;

    const testimoni = await Testimoni.findByPk(id);

    if (!testimoni) {
      return res.status(404).json({
        success: false,
        message: "Testimoni tidak ditemukan",
      });
    }

    // Hapus foto dari server
    if (testimoni.foto) {
      const fotoPath = path.join(__dirname, "../../public", testimoni.foto);
      if (fs.existsSync(fotoPath)) {
        fs.unlinkSync(fotoPath);
      }
    }

    await testimoni.destroy();

    res.status(200).json({
      success: true,
      message: "Testimoni berhasil dihapus",
    });
  } catch (error) {
    console.error("Error in deleteTestimoni:", error);
    next(error);
  }
};

module.exports = {
  getAllTestimoni,
  getTestimoniById,
  createTestimoni,
  updateTestimoni,
  deleteTestimoni,
};
