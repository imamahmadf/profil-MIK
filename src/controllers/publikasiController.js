const {
  Publikasi,
  PublikasiTranslation,
  TemaPublikasi,
  TemaPublikasiTranslation,
  Language,
} = require("../models");
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
 * Get all publikasi dengan pagination
 */
const getAllPublikasi = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const lang = req.query.lang || req.language?.code || "id";
    const temaId = req.query.temaId;

    // Get language ID
    const { language, error } = await validateAndGetLanguage(lang);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const where = {};
    if (temaId) {
      where.temaId = temaId;
    }

    const { count, rows } = await Publikasi.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ["tanggal", "DESC"],
        ["createdAt", "DESC"],
      ],
      include: [
        {
          model: PublikasiTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
        {
          model: TemaPublikasi,
          as: "tema",
          include: [
            {
              model: TemaPublikasiTranslation,
              as: "translations",
              where: { language_id: language.id },
              required: false,
            },
          ],
          required: false,
        },
      ],
      distinct: true,
    });

    // Format response dengan fallback ke default language
    const defaultLanguage = await Language.findOne({
      where: { is_default: true },
    });

    const formattedData = await Promise.all(
      rows.map(async (publikasi) => {
        let translation = publikasi.translations?.[0];

        // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
        if (!translation && defaultLanguage) {
          const defaultTranslation = await PublikasiTranslation.findOne({
            where: {
              publikasi_id: publikasi.id,
              language_id: defaultLanguage.id,
            },
          });
          if (defaultTranslation) {
            translation = defaultTranslation;
          }
        }

        // Handle tema translation
        let temaNama = null;
        if (publikasi.tema) {
          let temaTranslation = publikasi.tema.translations?.[0];
          if (!temaTranslation && defaultLanguage) {
            const defaultTemaTranslation =
              await TemaPublikasiTranslation.findOne({
                where: {
                  tema_publikasi_id: publikasi.tema.id,
                  language_id: defaultLanguage.id,
                },
              });
            if (defaultTemaTranslation) {
              temaTranslation = defaultTemaTranslation;
            }
          }
          temaNama = temaTranslation?.nama || null;
        }

        return {
          id: publikasi.id,
          foto: publikasi.foto,
          tanggal: publikasi.tanggal,
          link: publikasi.link,
          temaId: publikasi.temaId,
          tema: temaNama ? { id: publikasi.tema.id, nama: temaNama } : null,
          judul: translation?.judul || "No translation available",
          ringkasan: translation?.ringkasan || "",
          language: lang,
          createdAt: publikasi.createdAt,
          updatedAt: publikasi.updatedAt,
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
    console.error("Error in getAllPublikasi:", error);
    next(error);
  }
};

/**
 * Get publikasi by ID
 */
const getPublikasiById = async (req, res, next) => {
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

    const publikasi = await Publikasi.findByPk(id, {
      include: [
        {
          model: PublikasiTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
        {
          model: TemaPublikasi,
          as: "tema",
          include: [
            {
              model: TemaPublikasiTranslation,
              as: "translations",
              where: { language_id: language.id },
              required: false,
            },
          ],
          required: false,
        },
      ],
    });

    if (!publikasi) {
      return res.status(404).json({
        success: false,
        message: "Publikasi tidak ditemukan",
      });
    }

    // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
    let translation = publikasi.translations?.[0];
    if (!translation) {
      const defaultLanguage = await Language.findOne({
        where: { is_default: true },
      });
      if (defaultLanguage) {
        const defaultTranslation = await PublikasiTranslation.findOne({
          where: {
            publikasi_id: publikasi.id,
            language_id: defaultLanguage.id,
          },
        });
        if (defaultTranslation) {
          translation = defaultTranslation;
        }
      }
    }

    // Handle tema translation
    let temaNama = null;
    if (publikasi.tema) {
      let temaTranslation = publikasi.tema.translations?.[0];
      const defaultLanguage = await Language.findOne({
        where: { is_default: true },
      });
      if (!temaTranslation && defaultLanguage) {
        const defaultTemaTranslation = await TemaPublikasiTranslation.findOne({
          where: {
            tema_publikasi_id: publikasi.tema.id,
            language_id: defaultLanguage.id,
          },
        });
        if (defaultTemaTranslation) {
          temaTranslation = defaultTemaTranslation;
        }
      }
      temaNama = temaTranslation?.nama || null;
    }

    // Format response
    const formattedData = {
      id: publikasi.id,
      foto: publikasi.foto,
      tanggal: publikasi.tanggal,
      link: publikasi.link,
      temaId: publikasi.temaId,
      tema: temaNama ? { id: publikasi.tema.id, nama: temaNama } : null,
      judul: translation?.judul || "No translation available",
      ringkasan: translation?.ringkasan || "",
      language: lang,
      createdAt: publikasi.createdAt,
      updatedAt: publikasi.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getPublikasiById:", error);
    next(error);
  }
};

/**
 * Create new publikasi
 */
const createPublikasi = async (req, res, next) => {
  try {
    const { translations, foto, tanggal, temaId, link } = req.body;

    // Validasi: minimal harus ada terjemahan untuk bahasa default
    const defaultLang = await Language.findOne({ where: { is_default: true } });
    if (!defaultLang) {
      return res.status(400).json({
        success: false,
        message: "Bahasa default tidak ditemukan",
      });
    }

    // Validasi temaId jika ada
    if (temaId) {
      const tema = await TemaPublikasi.findByPk(temaId);
      if (!tema) {
        return res.status(400).json({
          success: false,
          message: "Tema publikasi tidak ditemukan",
        });
      }
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
      fotoPath = `/uploads/publikasi/${req.file.filename}`;
    }

    // Parse tanggal jika string
    let parsedTanggal = tanggal;
    if (tanggal && typeof tanggal === "string") {
      parsedTanggal = new Date(tanggal);
    }

    // Create publikasi
    const publikasi = await Publikasi.create({
      foto: fotoPath,
      tanggal: parsedTanggal,
      temaId: temaId || null,
      link: link || null,
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
        const translation = await PublikasiTranslation.create({
          publikasi_id: publikasi.id,
          language_id: language.id,
          judul: trans.judul,
          ringkasan: trans.ringkasan,
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
      // Hapus publikasi yang sudah dibuat jika ada error
      await publikasi.destroy();
      return res.status(400).json({
        success: false,
        message: "Gagal menyimpan beberapa terjemahan",
        errors: errors,
      });
    }

    // Reload publikasi dengan translations
    const publikasiWithData = await Publikasi.findByPk(publikasi.id, {
      include: [
        {
          model: PublikasiTranslation,
          as: "translations",
          include: [
            {
              model: Language,
              as: "language",
            },
          ],
        },
        {
          model: TemaPublikasi,
          as: "tema",
          include: [
            {
              model: TemaPublikasiTranslation,
              as: "translations",
            },
          ],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Publikasi berhasil dibuat",
      data: publikasiWithData,
    });
  } catch (error) {
    console.error("Error in createPublikasi:", error);
    next(error);
  }
};

/**
 * Update publikasi
 */
const updatePublikasi = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { translations, foto, tanggal, temaId, link } = req.body;

    const publikasi = await Publikasi.findByPk(id);

    if (!publikasi) {
      return res.status(404).json({
        success: false,
        message: "Publikasi tidak ditemukan",
      });
    }

    // Validasi temaId jika ada
    if (temaId !== undefined) {
      if (temaId) {
        const tema = await TemaPublikasi.findByPk(temaId);
        if (!tema) {
          return res.status(400).json({
            success: false,
            message: "Tema publikasi tidak ditemukan",
          });
        }
        publikasi.temaId = temaId;
      } else {
        publikasi.temaId = null;
      }
    }

    // Update foto jika ada
    if (foto !== undefined) {
      publikasi.foto = foto;
    }

    // Update tanggal jika ada
    if (tanggal !== undefined) {
      let parsedTanggal = tanggal;
      if (tanggal && typeof tanggal === "string") {
        parsedTanggal = new Date(tanggal);
      }
      publikasi.tanggal = parsedTanggal;
    }

    // Update link jika ada
    if (link !== undefined) {
      publikasi.link = link;
    }

    // Handle foto upload
    if (req.file) {
      // Hapus foto lama jika ada
      if (publikasi.foto) {
        const oldFotoPath = path.join(
          __dirname,
          "../../public",
          publikasi.foto
        );
        if (fs.existsSync(oldFotoPath)) {
          fs.unlinkSync(oldFotoPath);
        }
      }
      // Simpan path foto baru
      publikasi.foto = `/uploads/publikasi/${req.file.filename}`;
    }

    await publikasi.save();

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
          const existingTranslation = await PublikasiTranslation.findOne({
            where: {
              publikasi_id: publikasi.id,
              language_id: language.id,
            },
          });

          if (existingTranslation) {
            // Update translation yang sudah ada
            if (trans.judul) existingTranslation.judul = trans.judul;
            if (trans.ringkasan !== undefined)
              existingTranslation.ringkasan = trans.ringkasan;
            await existingTranslation.save();
          } else {
            // Buat translation baru
            await PublikasiTranslation.create({
              publikasi_id: publikasi.id,
              language_id: language.id,
              judul: trans.judul,
              ringkasan: trans.ringkasan,
            });
          }
        }
      }
    }

    // Reload publikasi dengan translations
    const publikasiWithData = await Publikasi.findByPk(publikasi.id, {
      include: [
        {
          model: PublikasiTranslation,
          as: "translations",
          include: [
            {
              model: Language,
              as: "language",
            },
          ],
        },
        {
          model: TemaPublikasi,
          as: "tema",
          include: [
            {
              model: TemaPublikasiTranslation,
              as: "translations",
            },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Publikasi berhasil diupdate",
      data: publikasiWithData,
    });
  } catch (error) {
    console.error("Error in updatePublikasi:", error);
    next(error);
  }
};

/**
 * Delete publikasi
 */
const deletePublikasi = async (req, res, next) => {
  try {
    const { id } = req.params;

    const publikasi = await Publikasi.findByPk(id);

    if (!publikasi) {
      return res.status(404).json({
        success: false,
        message: "Publikasi tidak ditemukan",
      });
    }

    // Hapus foto dari server
    if (publikasi.foto) {
      const fotoPath = path.join(__dirname, "../../public", publikasi.foto);
      if (fs.existsSync(fotoPath)) {
        fs.unlinkSync(fotoPath);
      }
    }

    await publikasi.destroy();

    res.status(200).json({
      success: true,
      message: "Publikasi berhasil dihapus",
    });
  } catch (error) {
    console.error("Error in deletePublikasi:", error);
    next(error);
  }
};

module.exports = {
  getAllPublikasi,
  getPublikasiById,
  createPublikasi,
  updatePublikasi,
  deletePublikasi,
};
