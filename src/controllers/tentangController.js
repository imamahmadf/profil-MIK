const { Tentang, TentangTranslation, Language } = require("../models");
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
 * Get tentang untuk beranda (public)
 */
const getTentang = async (req, res, next) => {
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

    // Cari tentang (biasanya hanya ada satu)
    const tentang = await Tentang.findOne({
      include: [
        {
          model: TentangTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!tentang) {
      return res.status(404).json({
        success: false,
        message: "Data tentang tidak ditemukan",
      });
    }

    // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
    let translation = tentang.translations?.[0];
    if (!translation) {
      const defaultLanguage = await Language.findOne({
        where: { is_default: true },
      });
      if (defaultLanguage) {
        const defaultTranslation = await TentangTranslation.findOne({
          where: {
            tentang_id: tentang.id,
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
      id: tentang.id,
      foto: tentang.foto,
      judul: translation?.judul || "No translation available",
      isi: translation?.isi || "",
      language: lang,
      createdAt: tentang.createdAt,
      updatedAt: tentang.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getTentang:", error);
    next(error);
  }
};

/**
 * Get all tentang (admin)
 */
const getAllTentang = async (req, res, next) => {
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

    const semuaTentang = await Tentang.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: TentangTranslation,
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
      semuaTentang.map(async (tentang) => {
        let translation = tentang.translations?.[0];

        if (!translation && defaultLanguage) {
          const defaultTranslation = await TentangTranslation.findOne({
            where: {
              tentang_id: tentang.id,
              language_id: defaultLanguage.id,
            },
          });
          if (defaultTranslation) {
            translation = defaultTranslation;
          }
        }

        return {
          id: tentang.id,
          foto: tentang.foto,
          judul: translation?.judul || "No translation available",
          isi: translation?.isi || "",
          language: lang,
          createdAt: tentang.createdAt,
          updatedAt: tentang.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getAllTentang:", error);
    next(error);
  }
};

/**
 * Get tentang by ID
 */
const getTentangById = async (req, res, next) => {
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

    const tentang = await Tentang.findByPk(id, {
      include: [
        {
          model: TentangTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
      ],
    });

    if (!tentang) {
      return res.status(404).json({
        success: false,
        message: "Data tentang tidak ditemukan",
      });
    }

    // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
    let translation = tentang.translations?.[0];
    if (!translation) {
      const defaultLanguage = await Language.findOne({
        where: { is_default: true },
      });
      if (defaultLanguage) {
        const defaultTranslation = await TentangTranslation.findOne({
          where: {
            tentang_id: tentang.id,
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
      id: tentang.id,
      foto: tentang.foto,
      judul: translation?.judul || "No translation available",
      isi: translation?.isi || "",
      language: lang,
      createdAt: tentang.createdAt,
      updatedAt: tentang.updatedAt,
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
 * Create new tentang
 */
const createTentang = async (req, res, next) => {
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
      fotoPath = `/uploads/tentang/${req.file.filename}`;
    }

    // Create tentang
    const tentang = await Tentang.create({
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
        const translation = await TentangTranslation.create({
          tentang_id: tentang.id,
          language_id: language.id,
          judul: trans.judul,
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
      // Hapus tentang yang sudah dibuat jika ada error
      await tentang.destroy();
      return res.status(400).json({
        success: false,
        message: "Gagal menyimpan beberapa terjemahan",
        errors: errors,
      });
    }

    // Reload tentang dengan translations
    const tentangWithData = await Tentang.findByPk(tentang.id, {
      include: [
        {
          model: TentangTranslation,
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
      message: "Data tentang berhasil dibuat",
      data: tentangWithData,
    });
  } catch (error) {
    console.error("Error in createTentang:", error);
    next(error);
  }
};

/**
 * Update tentang
 */
const updateTentang = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { translations, foto } = req.body;

    const tentang = await Tentang.findByPk(id);

    if (!tentang) {
      return res.status(404).json({
        success: false,
        message: "Data tentang tidak ditemukan",
      });
    }

    // Update foto jika ada
    if (foto !== undefined) {
      tentang.foto = foto;
    }

    // Handle foto upload
    if (req.file) {
      // Hapus foto lama jika ada
      if (tentang.foto) {
        const oldFotoPath = path.join(__dirname, "../../public", tentang.foto);
        if (fs.existsSync(oldFotoPath)) {
          fs.unlinkSync(oldFotoPath);
        }
      }
      // Simpan path foto baru
      tentang.foto = `/uploads/tentang/${req.file.filename}`;
    }

    await tentang.save();

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
          const existingTranslation = await TentangTranslation.findOne({
            where: {
              tentang_id: tentang.id,
              language_id: language.id,
            },
          });

          if (existingTranslation) {
            // Update translation yang sudah ada
            if (trans.judul) existingTranslation.judul = trans.judul;
            if (trans.isi !== undefined) existingTranslation.isi = trans.isi;
            await existingTranslation.save();
          } else {
            // Buat translation baru
            await TentangTranslation.create({
              tentang_id: tentang.id,
              language_id: language.id,
              judul: trans.judul,
              isi: trans.isi,
            });
          }
        }
      }
    }

    // Reload tentang dengan translations
    const tentangWithData = await Tentang.findByPk(tentang.id, {
      include: [
        {
          model: TentangTranslation,
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
      message: "Data tentang berhasil diupdate",
      data: tentangWithData,
    });
  } catch (error) {
    console.error("Error in updateTentang:", error);
    next(error);
  }
};

/**
 * Delete tentang
 */
const deleteTentang = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tentang = await Tentang.findByPk(id);

    if (!tentang) {
      return res.status(404).json({
        success: false,
        message: "Data tentang tidak ditemukan",
      });
    }

    // Hapus foto dari server
    if (tentang.foto) {
      const fotoPath = path.join(__dirname, "../../public", tentang.foto);
      if (fs.existsSync(fotoPath)) {
        fs.unlinkSync(fotoPath);
      }
    }

    await tentang.destroy();

    res.status(200).json({
      success: true,
      message: "Data tentang berhasil dihapus",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTentang,
  getAllTentang,
  getTentangById,
  createTentang,
  updateTentang,
  deleteTentang,
};
