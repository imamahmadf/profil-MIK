const { FaktaUnik, FaktaUnikTranslation, Language } = require("../models");
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
 * Get all fakta unik
 */
const getAllFaktaUnik = async (req, res, next) => {
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

    const semuaFaktaUnik = await FaktaUnik.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: FaktaUnikTranslation,
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
      semuaFaktaUnik.map(async (faktaUnik) => {
        let translation = faktaUnik.translations?.[0];

        if (!translation && defaultLanguage) {
          const defaultTranslation = await FaktaUnikTranslation.findOne({
            where: {
              fakta_unik_id: faktaUnik.id,
              language_id: defaultLanguage.id,
            },
          });
          if (defaultTranslation) {
            translation = defaultTranslation;
          }
        }

        return {
          id: faktaUnik.id,
          angka: faktaUnik.angka,
          satuan: translation?.satuan || null,
          isi: translation?.isi || "No translation available",
          language: lang,
          createdAt: faktaUnik.createdAt,
          updatedAt: faktaUnik.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getAllFaktaUnik:", error);
    next(error);
  }
};

/**
 * Get fakta unik by ID
 */
const getFaktaUnikById = async (req, res, next) => {
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

    const faktaUnik = await FaktaUnik.findByPk(id, {
      include: [
        {
          model: FaktaUnikTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
      ],
    });

    if (!faktaUnik) {
      return res.status(404).json({
        success: false,
        message: "Data fakta unik tidak ditemukan",
      });
    }

    // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
    let translation = faktaUnik.translations?.[0];
    if (!translation) {
      const defaultLanguage = await Language.findOne({
        where: { is_default: true },
      });
      if (defaultLanguage) {
        const defaultTranslation = await FaktaUnikTranslation.findOne({
          where: {
            fakta_unik_id: faktaUnik.id,
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
      id: faktaUnik.id,
      angka: faktaUnik.angka,
      satuan: translation?.satuan || null,
      isi: translation?.isi || "No translation available",
      language: lang,
      createdAt: faktaUnik.createdAt,
      updatedAt: faktaUnik.updatedAt,
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
 * Create new fakta unik
 */
const createFaktaUnik = async (req, res, next) => {
  try {
    const { angka, translations } = req.body;

    // Validasi angka
    if (angka === undefined || angka === null || angka === "") {
      return res.status(400).json({
        success: false,
        message: "Angka harus diisi dan berupa bilangan",
      });
    }

    // Konversi ke number jika perlu (untuk keamanan)
    const angkaNumber =
      typeof angka === "string" ? parseInt(angka, 10) : Number(angka);

    // Validasi angka harus berupa bilangan dan lebih besar dari 0
    if (isNaN(angkaNumber) || angkaNumber <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Angka harus diisi dan berupa bilangan yang lebih besar dari 0",
      });
    }

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

    // Create fakta unik
    const faktaUnik = await FaktaUnik.create({
      angka: angkaNumber,
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
        const translation = await FaktaUnikTranslation.create({
          fakta_unik_id: faktaUnik.id,
          language_id: language.id,
          satuan: trans.satuan || null,
          isi: trans.isi,
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
      // Hapus fakta unik yang sudah dibuat jika ada error
      await faktaUnik.destroy();
      return res.status(400).json({
        success: false,
        message: "Gagal menyimpan beberapa terjemahan",
        errors: errors,
      });
    }

    // Reload fakta unik dengan translations
    const faktaUnikWithData = await FaktaUnik.findByPk(faktaUnik.id, {
      include: [
        {
          model: FaktaUnikTranslation,
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
      message: "Data fakta unik berhasil dibuat",
      data: faktaUnikWithData,
    });
  } catch (error) {
    console.error("Error in createFaktaUnik:", error);
    next(error);
  }
};

/**
 * Update fakta unik
 */
const updateFaktaUnik = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { angka, translations } = req.body;

    const faktaUnik = await FaktaUnik.findByPk(id);

    if (!faktaUnik) {
      return res.status(404).json({
        success: false,
        message: "Data fakta unik tidak ditemukan",
      });
    }

    // Update angka jika ada
    if (angka !== undefined) {
      // Konversi ke number jika perlu (untuk keamanan)
      const angkaNumber =
        typeof angka === "string" ? parseInt(angka, 10) : Number(angka);

      if (isNaN(angkaNumber) || angkaNumber <= 0) {
        return res.status(400).json({
          success: false,
          message: "Angka harus berupa bilangan yang lebih besar dari 0",
        });
      }
      faktaUnik.angka = angkaNumber;
    }

    await faktaUnik.save();

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
          const existingTranslation = await FaktaUnikTranslation.findOne({
            where: {
              fakta_unik_id: faktaUnik.id,
              language_id: language.id,
            },
          });

          if (existingTranslation) {
            // Update translation yang sudah ada
            if (trans.isi !== undefined) existingTranslation.isi = trans.isi;
            if (trans.satuan !== undefined) existingTranslation.satuan = trans.satuan;
            await existingTranslation.save();
          } else {
            // Buat translation baru
            await FaktaUnikTranslation.create({
              fakta_unik_id: faktaUnik.id,
              language_id: language.id,
              satuan: trans.satuan || null,
              isi: trans.isi,
            });
          }
        }
      }
    }

    // Reload fakta unik dengan translations
    const faktaUnikWithData = await FaktaUnik.findByPk(faktaUnik.id, {
      include: [
        {
          model: FaktaUnikTranslation,
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
      message: "Data fakta unik berhasil diupdate",
      data: faktaUnikWithData,
    });
  } catch (error) {
    console.error("Error in updateFaktaUnik:", error);
    next(error);
  }
};

/**
 * Delete fakta unik
 */
const deleteFaktaUnik = async (req, res, next) => {
  try {
    const { id } = req.params;

    const faktaUnik = await FaktaUnik.findByPk(id);

    if (!faktaUnik) {
      return res.status(404).json({
        success: false,
        message: "Data fakta unik tidak ditemukan",
      });
    }

    await faktaUnik.destroy();

    res.status(200).json({
      success: true,
      message: "Data fakta unik berhasil dihapus",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFaktaUnik,
  getFaktaUnikById,
  createFaktaUnik,
  updateFaktaUnik,
  deleteFaktaUnik,
};
