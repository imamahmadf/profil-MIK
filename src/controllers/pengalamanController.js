const {
  Pengalaman,
  PengalamanTranslation,
  KegiatanPengalaman,
  KegiatanPengalamanTranslation,
  Language,
} = require("../models");
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
 * Get all pengalaman
 */
const getAllPengalaman = async (req, res, next) => {
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

    const pengalamans = await Pengalaman.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: PengalamanTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
        {
          model: KegiatanPengalaman,
          as: "kegiatans",
          include: [
            {
              model: KegiatanPengalamanTranslation,
              as: "translations",
              where: { language_id: language.id },
              required: false,
            },
          ],
          order: [["urutan", "ASC"]],
          separate: true,
        },
      ],
    });

    // Format response dengan fallback ke default language
    const defaultLanguage = await Language.findOne({
      where: { is_default: true },
    });

    const formattedData = await Promise.all(
      pengalamans.map(async (pengalaman) => {
        let translation = pengalaman.translations?.[0];

        // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
        if (!translation && defaultLanguage) {
          const defaultTranslation = await PengalamanTranslation.findOne({
            where: {
              pengalaman_id: pengalaman.id,
              language_id: defaultLanguage.id,
            },
          });
          if (defaultTranslation) {
            translation = defaultTranslation;
          }
        }

        // Format kegiatans dengan fallback ke default language
        const formattedKegiatans = await Promise.all(
          pengalaman.kegiatans.map(async (kegiatan) => {
            let kegiatanTranslation = kegiatan.translations?.[0];

            if (!kegiatanTranslation && defaultLanguage) {
              const defaultKegiatanTranslation =
                await KegiatanPengalamanTranslation.findOne({
                  where: {
                    kegiatan_pengalaman_id: kegiatan.id,
                    language_id: defaultLanguage.id,
                  },
                });
              if (defaultKegiatanTranslation) {
                kegiatanTranslation = defaultKegiatanTranslation;
              }
            }

            return {
              id: kegiatan.id,
              kegiatan: kegiatanTranslation?.kegiatan || "",
              urutan: kegiatan.urutan,
            };
          })
        );

        return {
          id: pengalaman.id,
          durasi: pengalaman.durasi,
          posisi: translation?.posisi || "No translation available",
          instansi: translation?.instansi || "",
          kegiatans: formattedKegiatans,
          language: lang,
          createdAt: pengalaman.createdAt,
          updatedAt: pengalaman.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getAllPengalaman:", error);
    next(error);
  }
};

/**
 * Get pengalaman by ID
 */
const getPengalamanById = async (req, res, next) => {
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

    const pengalaman = await Pengalaman.findByPk(id, {
      include: [
        {
          model: PengalamanTranslation,
          as: "translations",
          where: { language_id: language.id },
          required: false,
        },
        {
          model: KegiatanPengalaman,
          as: "kegiatans",
          include: [
            {
              model: KegiatanPengalamanTranslation,
              as: "translations",
              where: { language_id: language.id },
              required: false,
            },
          ],
          order: [["urutan", "ASC"]],
          separate: true,
        },
      ],
    });

    if (!pengalaman) {
      return res.status(404).json({
        success: false,
        message: "Pengalaman tidak ditemukan",
      });
    }

    // Jika translation tidak ada untuk bahasa yang diminta, ambil dari default language
    let translation = pengalaman.translations?.[0];
    if (!translation) {
      const defaultLanguage = await Language.findOne({
        where: { is_default: true },
      });
      if (defaultLanguage) {
        const defaultTranslation = await PengalamanTranslation.findOne({
          where: {
            pengalaman_id: pengalaman.id,
            language_id: defaultLanguage.id,
          },
        });
        if (defaultTranslation) {
          translation = defaultTranslation;
        }
      }
    }

    // Format kegiatans dengan fallback ke default language
    const defaultLanguage = await Language.findOne({
      where: { is_default: true },
    });

    const formattedKegiatans = await Promise.all(
      pengalaman.kegiatans.map(async (kegiatan) => {
        let kegiatanTranslation = kegiatan.translations?.[0];

        if (!kegiatanTranslation && defaultLanguage) {
          const defaultKegiatanTranslation =
            await KegiatanPengalamanTranslation.findOne({
              where: {
                kegiatan_pengalaman_id: kegiatan.id,
                language_id: defaultLanguage.id,
              },
            });
          if (defaultKegiatanTranslation) {
            kegiatanTranslation = defaultKegiatanTranslation;
          }
        }

        return {
          id: kegiatan.id,
          kegiatan: kegiatanTranslation?.kegiatan || "",
          urutan: kegiatan.urutan,
        };
      })
    );

    // Format response
    const formattedData = {
      id: pengalaman.id,
      durasi: pengalaman.durasi,
      posisi: translation?.posisi || "No translation available",
      instansi: translation?.instansi || "",
      kegiatans: formattedKegiatans,
      language: lang,
      createdAt: pengalaman.createdAt,
      updatedAt: pengalaman.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getPengalamanById:", error);
    next(error);
  }
};

/**
 * Create new pengalaman
 */
const createPengalaman = async (req, res, next) => {
  try {
    const { translations, durasi, kegiatans } = req.body;

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

    // Create pengalaman
    const pengalaman = await Pengalaman.create({
      durasi: durasi || null,
    });

    // Create translations
    const translationResults = [];
    const errors = [];

    for (const trans of finalTranslations) {
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

      try {
        const translation = await PengalamanTranslation.create({
          pengalaman_id: pengalaman.id,
          language_id: language.id,
          posisi: trans.posisi,
          instansi: trans.instansi,
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
      await pengalaman.destroy();
      return res.status(400).json({
        success: false,
        message: "Gagal menyimpan beberapa terjemahan",
        errors: errors,
      });
    }

    // Create kegiatans jika ada
    if (kegiatans && Array.isArray(kegiatans) && kegiatans.length > 0) {
      for (let i = 0; i < kegiatans.length; i++) {
        const kegiatanData = kegiatans[i];
        let kegiatanTranslations = kegiatanData.translations;

        // Parse translations jika string
        if (typeof kegiatanTranslations === "string") {
          try {
            kegiatanTranslations = JSON.parse(kegiatanTranslations);
          } catch (parseError) {
            continue;
          }
        }

        if (
          !Array.isArray(kegiatanTranslations) ||
          kegiatanTranslations.length === 0
        ) {
          continue;
        }

        // Create kegiatan pengalaman
        const kegiatan = await KegiatanPengalaman.create({
          pengalaman_id: pengalaman.id,
          urutan: kegiatanData.urutan !== undefined ? kegiatanData.urutan : i,
        });

        // Create kegiatan translations
        for (const trans of kegiatanTranslations) {
          const { language, error } = await validateAndGetLanguage(
            trans.language_code
          );

          if (error) continue;

          try {
            await KegiatanPengalamanTranslation.create({
              kegiatan_pengalaman_id: kegiatan.id,
              language_id: language.id,
              kegiatan: trans.kegiatan,
            });
          } catch (error) {
            console.error(
              `Error creating kegiatan translation for language ${trans.language_code}:`,
              error
            );
          }
        }
      }
    }

    // Reload pengalaman dengan translations dan kegiatans
    const pengalamanWithData = await Pengalaman.findByPk(pengalaman.id, {
      include: [
        {
          model: PengalamanTranslation,
          as: "translations",
          include: [
            {
              model: Language,
              as: "language",
            },
          ],
        },
        {
          model: KegiatanPengalaman,
          as: "kegiatans",
          include: [
            {
              model: KegiatanPengalamanTranslation,
              as: "translations",
              include: [
                {
                  model: Language,
                  as: "language",
                },
              ],
            },
          ],
          order: [["urutan", "ASC"]],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Pengalaman berhasil dibuat",
      data: pengalamanWithData,
    });
  } catch (error) {
    console.error("Error in createPengalaman:", error);
    next(error);
  }
};

/**
 * Update pengalaman
 */
const updatePengalaman = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { translations, durasi, kegiatans } = req.body;

    const pengalaman = await Pengalaman.findByPk(id);

    if (!pengalaman) {
      return res.status(404).json({
        success: false,
        message: "Pengalaman tidak ditemukan",
      });
    }

    // Update durasi jika ada
    if (durasi !== undefined) {
      pengalaman.durasi = durasi;
    }

    await pengalaman.save();

    // Update translations jika ada
    if (translations) {
      let parsedTranslations = translations;
      if (typeof parsedTranslations === "string") {
        try {
          parsedTranslations = JSON.parse(parsedTranslations);
        } catch (parseError) {
          return res.status(400).json({
            success: false,
            message: "Format translations tidak valid",
          });
        }
      }

      if (
        parsedTranslations &&
        Array.isArray(parsedTranslations) &&
        parsedTranslations.length > 0
      ) {
        for (const trans of parsedTranslations) {
          const { language, error } = await validateAndGetLanguage(
            trans.language_code
          );

          if (error) continue;

          const existingTranslation = await PengalamanTranslation.findOne({
            where: {
              pengalaman_id: pengalaman.id,
              language_id: language.id,
            },
          });

          if (existingTranslation) {
            if (trans.posisi) existingTranslation.posisi = trans.posisi;
            if (trans.instansi !== undefined)
              existingTranslation.instansi = trans.instansi;
            await existingTranslation.save();
          } else {
            await PengalamanTranslation.create({
              pengalaman_id: pengalaman.id,
              language_id: language.id,
              posisi: trans.posisi,
              instansi: trans.instansi,
            });
          }
        }
      }
    }

    // Update kegiatans jika ada (akan replace semua kegiatan yang ada)
    if (kegiatans !== undefined && Array.isArray(kegiatans)) {
      // Hapus semua kegiatan lama
      await KegiatanPengalaman.destroy({
        where: { pengalaman_id: pengalaman.id },
      });

      // Buat kegiatan baru
      for (let i = 0; i < kegiatans.length; i++) {
        const kegiatanData = kegiatans[i];
        let kegiatanTranslations = kegiatanData.translations;

        if (typeof kegiatanTranslations === "string") {
          try {
            kegiatanTranslations = JSON.parse(kegiatanTranslations);
          } catch (parseError) {
            continue;
          }
        }

        if (
          !Array.isArray(kegiatanTranslations) ||
          kegiatanTranslations.length === 0
        ) {
          continue;
        }

        const kegiatan = await KegiatanPengalaman.create({
          pengalaman_id: pengalaman.id,
          urutan: kegiatanData.urutan !== undefined ? kegiatanData.urutan : i,
        });

        for (const trans of kegiatanTranslations) {
          const { language, error } = await validateAndGetLanguage(
            trans.language_code
          );

          if (error) continue;

          try {
            await KegiatanPengalamanTranslation.create({
              kegiatan_pengalaman_id: kegiatan.id,
              language_id: language.id,
              kegiatan: trans.kegiatan,
            });
          } catch (error) {
            console.error("Error creating kegiatan translation:", error);
          }
        }
      }
    }

    // Reload pengalaman dengan translations dan kegiatans
    const pengalamanWithData = await Pengalaman.findByPk(pengalaman.id, {
      include: [
        {
          model: PengalamanTranslation,
          as: "translations",
          include: [
            {
              model: Language,
              as: "language",
            },
          ],
        },
        {
          model: KegiatanPengalaman,
          as: "kegiatans",
          include: [
            {
              model: KegiatanPengalamanTranslation,
              as: "translations",
              include: [
                {
                  model: Language,
                  as: "language",
                },
              ],
            },
          ],
          order: [["urutan", "ASC"]],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Pengalaman berhasil diupdate",
      data: pengalamanWithData,
    });
  } catch (error) {
    console.error("Error in updatePengalaman:", error);
    next(error);
  }
};

/**
 * Delete pengalaman
 */
const deletePengalaman = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pengalaman = await Pengalaman.findByPk(id);

    if (!pengalaman) {
      return res.status(404).json({
        success: false,
        message: "Pengalaman tidak ditemukan",
      });
    }

    await pengalaman.destroy();

    res.status(200).json({
      success: true,
      message: "Pengalaman berhasil dihapus",
    });
  } catch (error) {
    console.error("Error in deletePengalaman:", error);
    next(error);
  }
};

module.exports = {
  getAllPengalaman,
  getPengalamanById,
  createPengalaman,
  updatePengalaman,
  deletePengalaman,
};
