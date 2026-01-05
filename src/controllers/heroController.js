const { Hero, HeroTranslation, Language } = require("../models");
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
 * Get hero aktif untuk beranda (public)
 */
const getHero = async (req, res, next) => {
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

    // Cari hero yang aktif
    const hero = await Hero.findOne({
      where: { is_active: true },
      include: [
        {
          model: HeroTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!hero) {
      return res.status(404).json({
        success: false,
        message: "Hero tidak ditemukan",
      });
    }

    // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
    let translation = hero.translations?.[0];
    if (!translation) {
      const defaultLanguage = await Language.findOne({
        where: { is_default: true },
      });
      if (defaultLanguage) {
        const defaultTranslation = await HeroTranslation.findOne({
          where: {
            hero_id: hero.id,
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
      id: hero.id,
      foto: hero.foto,
      is_active: hero.is_active,
      nama: translation?.nama || "No translation available",
      slogan: translation?.slogan || "",
      isi: translation?.isi || "",
      language: lang,
      createdAt: hero.createdAt,
      updatedAt: hero.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getHero:", error);
    next(error);
  }
};

/**
 * Get all hero (admin)
 */
const getAllHero = async (req, res, next) => {
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

    const heroes = await Hero.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: HeroTranslation,
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
      heroes.map(async (hero) => {
        let translation = hero.translations?.[0];

        if (!translation && defaultLanguage) {
          const defaultTranslation = await HeroTranslation.findOne({
            where: {
              hero_id: hero.id,
              language_id: defaultLanguage.id,
            },
          });
          if (defaultTranslation) {
            translation = defaultTranslation;
          }
        }

        return {
          id: hero.id,
          foto: hero.foto,
          is_active: hero.is_active,
          nama: translation?.nama || "No translation available",
          slogan: translation?.slogan || "",
          isi: translation?.isi || "",
          language: lang,
          createdAt: hero.createdAt,
          updatedAt: hero.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getAllHero:", error);
    next(error);
  }
};

/**
 * Get hero by ID
 */
const getHeroById = async (req, res, next) => {
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

    const hero = await Hero.findByPk(id, {
      include: [
        {
          model: HeroTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
      ],
    });

    if (!hero) {
      return res.status(404).json({
        success: false,
        message: "Hero tidak ditemukan",
      });
    }

    // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
    let translation = hero.translations?.[0];
    if (!translation) {
      const defaultLanguage = await Language.findOne({
        where: { is_default: true },
      });
      if (defaultLanguage) {
        const defaultTranslation = await HeroTranslation.findOne({
          where: {
            hero_id: hero.id,
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
      id: hero.id,
      foto: hero.foto,
      is_active: hero.is_active,
      nama: translation?.nama || "No translation available",
      slogan: translation?.slogan || "",
      isi: translation?.isi || "",
      language: lang,
      createdAt: hero.createdAt,
      updatedAt: hero.updatedAt,
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
 * Create new hero
 */
const createHero = async (req, res, next) => {
  try {
    const { translations, foto, is_active } = req.body;

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
      fotoPath = `/uploads/hero/${req.file.filename}`;
    }

    // Create hero
    const hero = await Hero.create({
      foto: fotoPath,
      is_active: is_active !== undefined ? is_active : true,
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
        const translation = await HeroTranslation.create({
          hero_id: hero.id,
          language_id: language.id,
          nama: trans.nama,
          slogan: trans.slogan,
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
      // Hapus hero yang sudah dibuat jika ada error
      await hero.destroy();
      return res.status(400).json({
        success: false,
        message: "Gagal menyimpan beberapa terjemahan",
        errors: errors,
      });
    }

    // Reload hero dengan translations
    const heroWithData = await Hero.findByPk(hero.id, {
      include: [
        {
          model: HeroTranslation,
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
      message: "Hero berhasil dibuat",
      data: heroWithData,
    });
  } catch (error) {
    console.error("Error in createHero:", error);
    next(error);
  }
};

/**
 * Update hero
 */
const updateHero = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { translations, foto, is_active } = req.body;

    const hero = await Hero.findByPk(id);

    if (!hero) {
      return res.status(404).json({
        success: false,
        message: "Hero tidak ditemukan",
      });
    }

    // Update foto jika ada
    if (foto !== undefined) {
      hero.foto = foto;
    }

    // Update is_active jika ada
    if (is_active !== undefined) {
      hero.is_active = is_active;
    }

    // Handle foto upload
    if (req.file) {
      // Hapus foto lama jika ada
      if (hero.foto) {
        const oldFotoPath = path.join(__dirname, "../../public", hero.foto);
        if (fs.existsSync(oldFotoPath)) {
          fs.unlinkSync(oldFotoPath);
        }
      }
      // Simpan path foto baru
      hero.foto = `/uploads/hero/${req.file.filename}`;
    }

    await hero.save();

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
          const existingTranslation = await HeroTranslation.findOne({
            where: {
              hero_id: hero.id,
              language_id: language.id,
            },
          });

          if (existingTranslation) {
            // Update translation yang sudah ada
            if (trans.nama) existingTranslation.nama = trans.nama;
            if (trans.slogan !== undefined)
              existingTranslation.slogan = trans.slogan;
            if (trans.isi !== undefined) existingTranslation.isi = trans.isi;
            await existingTranslation.save();
          } else {
            // Buat translation baru
            await HeroTranslation.create({
              hero_id: hero.id,
              language_id: language.id,
              nama: trans.nama,
              slogan: trans.slogan,
              isi: trans.isi,
            });
          }
        }
      }
    }

    // Reload hero dengan translations
    const heroWithData = await Hero.findByPk(hero.id, {
      include: [
        {
          model: HeroTranslation,
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
      message: "Hero berhasil diupdate",
      data: heroWithData,
    });
  } catch (error) {
    console.error("Error in updateHero:", error);
    next(error);
  }
};

/**
 * Delete hero
 */
const deleteHero = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hero = await Hero.findByPk(id);

    if (!hero) {
      return res.status(404).json({
        success: false,
        message: "Hero tidak ditemukan",
      });
    }

    // Hapus foto dari server
    if (hero.foto) {
      const fotoPath = path.join(__dirname, "../../public", hero.foto);
      if (fs.existsSync(fotoPath)) {
        fs.unlinkSync(fotoPath);
      }
    }

    await hero.destroy();

    res.status(200).json({
      success: true,
      message: "Hero berhasil dihapus",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHero,
  getAllHero,
  getHeroById,
  createHero,
  updateHero,
  deleteHero,
};
