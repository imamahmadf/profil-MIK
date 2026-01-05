const {
  TemaPublikasi,
  TemaPublikasiTranslation,
  Language,
} = require("../models");

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
 * Get all tema publikasi
 */
const getAllTemaPublikasi = async (req, res, next) => {
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

    const temas = await TemaPublikasi.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: TemaPublikasiTranslation,
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
      temas.map(async (tema) => {
        let translation = tema.translations?.[0];

        if (!translation && defaultLanguage) {
          const defaultTranslation = await TemaPublikasiTranslation.findOne({
            where: {
              tema_publikasi_id: tema.id,
              language_id: defaultLanguage.id,
            },
          });
          if (defaultTranslation) {
            translation = defaultTranslation;
          }
        }

        return {
          id: tema.id,
          nama: translation?.nama || "No translation available",
          language: lang,
          createdAt: tema.createdAt,
          updatedAt: tema.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getAllTemaPublikasi:", error);
    next(error);
  }
};

/**
 * Get tema publikasi by ID
 */
const getTemaPublikasiById = async (req, res, next) => {
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

    const tema = await TemaPublikasi.findByPk(id, {
      include: [
        {
          model: TemaPublikasiTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
      ],
    });

    if (!tema) {
      return res.status(404).json({
        success: false,
        message: "Tema publikasi tidak ditemukan",
      });
    }

    // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
    let translation = tema.translations?.[0];
    if (!translation) {
      const defaultLanguage = await Language.findOne({
        where: { is_default: true },
      });
      if (defaultLanguage) {
        const defaultTranslation = await TemaPublikasiTranslation.findOne({
          where: {
            tema_publikasi_id: tema.id,
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
      id: tema.id,
      nama: translation?.nama || "No translation available",
      language: lang,
      createdAt: tema.createdAt,
      updatedAt: tema.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getTemaPublikasiById:", error);
    next(error);
  }
};

/**
 * Create new tema publikasi
 */
const createTemaPublikasi = async (req, res, next) => {
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

    // Create tema publikasi
    const tema = await TemaPublikasi.create({});

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
        const translation = await TemaPublikasiTranslation.create({
          tema_publikasi_id: tema.id,
          language_id: language.id,
          nama: trans.nama,
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
      // Hapus tema yang sudah dibuat jika ada error
      await tema.destroy();
      return res.status(400).json({
        success: false,
        message: "Gagal menyimpan beberapa terjemahan",
        errors: errors,
      });
    }

    // Reload tema dengan translations
    const temaWithData = await TemaPublikasi.findByPk(tema.id, {
      include: [
        {
          model: TemaPublikasiTranslation,
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
      message: "Tema publikasi berhasil dibuat",
      data: temaWithData,
    });
  } catch (error) {
    console.error("Error in createTemaPublikasi:", error);
    next(error);
  }
};

/**
 * Update tema publikasi
 */
const updateTemaPublikasi = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { translations } = req.body;

    const tema = await TemaPublikasi.findByPk(id);

    if (!tema) {
      return res.status(404).json({
        success: false,
        message: "Tema publikasi tidak ditemukan",
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
          const existingTranslation = await TemaPublikasiTranslation.findOne({
            where: {
              tema_publikasi_id: tema.id,
              language_id: language.id,
            },
          });

          if (existingTranslation) {
            // Update translation yang sudah ada
            if (trans.nama) existingTranslation.nama = trans.nama;
            await existingTranslation.save();
          } else {
            // Buat translation baru
            await TemaPublikasiTranslation.create({
              tema_publikasi_id: tema.id,
              language_id: language.id,
              nama: trans.nama,
            });
          }
        }
      }
    }

    // Reload tema dengan translations
    const temaWithData = await TemaPublikasi.findByPk(tema.id, {
      include: [
        {
          model: TemaPublikasiTranslation,
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
      message: "Tema publikasi berhasil diupdate",
      data: temaWithData,
    });
  } catch (error) {
    console.error("Error in updateTemaPublikasi:", error);
    next(error);
  }
};

/**
 * Delete tema publikasi
 */
const deleteTemaPublikasi = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tema = await TemaPublikasi.findByPk(id);

    if (!tema) {
      return res.status(404).json({
        success: false,
        message: "Tema publikasi tidak ditemukan",
      });
    }

    await tema.destroy();

    res.status(200).json({
      success: true,
      message: "Tema publikasi berhasil dihapus",
    });
  } catch (error) {
    console.error("Error in deleteTemaPublikasi:", error);
    next(error);
  }
};

module.exports = {
  getAllTemaPublikasi,
  getTemaPublikasiById,
  createTemaPublikasi,
  updateTemaPublikasi,
  deleteTemaPublikasi,
};
