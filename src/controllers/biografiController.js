const { Biografi, BiografiTranslation, Language } = require("../models");
const { Op } = require("sequelize");

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
 * Get biografi (public) - biasanya hanya ada satu biografi
 */
const getBiografi = async (req, res, next) => {
  try {
    const lang = req.query.lang || req.language?.code || "id";

    // Get language ID
    const { language, error } = await validateAndGetLanguage(lang);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    // Cari biografi (ambil yang pertama jika ada beberapa)
    const biografi = await Biografi.findOne({
      include: [
        {
          model: BiografiTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!biografi) {
      return res.status(404).json({
        success: false,
        message: "Biografi tidak ditemukan",
      });
    }

    // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
    let translation = biografi.translations?.[0];
    if (!translation) {
      const defaultLanguage = await Language.findOne({
        where: { is_default: true },
      });
      if (defaultLanguage) {
        const defaultTranslation = await BiografiTranslation.findOne({
          where: {
            biografi_id: biografi.id,
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
      id: biografi.id,
      judul: translation?.judul || "No translation available",
      isi: translation?.isi || "",
      slogan: translation?.slogan || "",
      language: lang,
      createdAt: biografi.createdAt,
      updatedAt: biografi.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getBiografi:", error);
    next(error);
  }
};

/**
 * Get all biografi (admin) - untuk melihat semua biografi jika ada beberapa
 */
const getAllBiografi = async (req, res, next) => {
  try {
    const lang = req.query.lang || req.language?.code || "id";

    // Get language ID
    const { language, error } = await validateAndGetLanguage(lang);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const biografis = await Biografi.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: BiografiTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
      ],
    });

    // Format response dengan fallback ke default language
    const defaultLanguage = await Language.findOne({
      where: { is_default: true },
    });

    const formattedData = await Promise.all(
      biografis.map(async (biografi) => {
        let translation = biografi.translations?.[0];

        if (!translation && defaultLanguage) {
          const defaultTranslation = await BiografiTranslation.findOne({
            where: {
              biografi_id: biografi.id,
              language_id: defaultLanguage.id,
            },
          });
          if (defaultTranslation) {
            translation = defaultTranslation;
          }
        }

        return {
          id: biografi.id,
          judul: translation?.judul || "No translation available",
          isi: translation?.isi || "",
          slogan: translation?.slogan || "",
          language: lang,
          createdAt: biografi.createdAt,
          updatedAt: biografi.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getAllBiografi:", error);
    next(error);
  }
};

/**
 * Get biografi by ID
 */
const getBiografiById = async (req, res, next) => {
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

    const biografi = await Biografi.findByPk(id, {
      include: [
        {
          model: BiografiTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
      ],
    });

    if (!biografi) {
      return res.status(404).json({
        success: false,
        message: "Biografi tidak ditemukan",
      });
    }

    // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
    let translation = biografi.translations?.[0];
    if (!translation) {
      const defaultLanguage = await Language.findOne({
        where: { is_default: true },
      });
      if (defaultLanguage) {
        const defaultTranslation = await BiografiTranslation.findOne({
          where: {
            biografi_id: biografi.id,
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
      id: biografi.id,
      judul: translation?.judul || "No translation available",
      isi: translation?.isi || "",
      slogan: translation?.slogan || "",
      language: lang,
      createdAt: biografi.createdAt,
      updatedAt: biografi.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getBiografiById:", error);
    next(error);
  }
};

/**
 * Create new biografi
 */
const createBiografi = async (req, res, next) => {
  try {
    const { translations } = req.body;

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

    // Create biografi
    const biografi = await Biografi.create({});

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
        const translation = await BiografiTranslation.create({
          biografi_id: biografi.id,
          language_id: language.id,
          judul: trans.judul,
          isi: trans.isi,
          slogan: trans.slogan,
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
      // Hapus biografi yang sudah dibuat jika ada error
      await biografi.destroy();
      return res.status(400).json({
        success: false,
        message: "Gagal menyimpan beberapa terjemahan",
        errors: errors,
      });
    }

    // Reload biografi dengan translations
    const biografiWithData = await Biografi.findByPk(biografi.id, {
      include: [
        {
          model: BiografiTranslation,
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
      message: "Biografi berhasil dibuat",
      data: biografiWithData,
    });
  } catch (error) {
    console.error("Error in createBiografi:", error);
    next(error);
  }
};

/**
 * Update biografi
 */
const updateBiografi = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { translations } = req.body;

    const biografi = await Biografi.findByPk(id);

    if (!biografi) {
      return res.status(404).json({
        success: false,
        message: "Biografi tidak ditemukan",
      });
    }

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
          const existingTranslation = await BiografiTranslation.findOne({
            where: {
              biografi_id: biografi.id,
              language_id: language.id,
            },
          });

          if (existingTranslation) {
            // Update translation yang sudah ada
            if (trans.judul) existingTranslation.judul = trans.judul;
            if (trans.isi !== undefined) existingTranslation.isi = trans.isi;
            if (trans.slogan !== undefined)
              existingTranslation.slogan = trans.slogan;
            await existingTranslation.save();
          } else {
            // Buat translation baru
            await BiografiTranslation.create({
              biografi_id: biografi.id,
              language_id: language.id,
              judul: trans.judul,
              isi: trans.isi,
              slogan: trans.slogan,
            });
          }
        }
      }
    }

    // Reload biografi dengan translations
    const biografiWithData = await Biografi.findByPk(biografi.id, {
      include: [
        {
          model: BiografiTranslation,
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
      message: "Biografi berhasil diupdate",
      data: biografiWithData,
    });
  } catch (error) {
    console.error("Error in updateBiografi:", error);
    next(error);
  }
};

/**
 * Delete biografi
 */
const deleteBiografi = async (req, res, next) => {
  try {
    const { id } = req.params;

    const biografi = await Biografi.findByPk(id);

    if (!biografi) {
      return res.status(404).json({
        success: false,
        message: "Biografi tidak ditemukan",
      });
    }

    await biografi.destroy();

    res.status(200).json({
      success: true,
      message: "Biografi berhasil dihapus",
    });
  } catch (error) {
    console.error("Error in deleteBiografi:", error);
    next(error);
  }
};

module.exports = {
  getBiografi,
  getAllBiografi,
  getBiografiById,
  createBiografi,
  updateBiografi,
  deleteBiografi,
};
