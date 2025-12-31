# Contoh Implementasi Multi-Language dengan Sequelize

## 1. Migration untuk Tabel Languages

```javascript
// migrations/XXXXXX-create-languages.js
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("languages", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      code: {
        type: Sequelize.STRING(5),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    // Insert default languages
    await queryInterface.bulkInsert("languages", [
      { code: "id", name: "Indonesian", is_default: true, is_active: true },
      { code: "en", name: "English", is_default: false, is_active: true },
      { code: "ar", name: "Arabic", is_default: false, is_active: true },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("languages");
  },
};
```

## 2. Migration untuk Update Tabel Berita

```javascript
// migrations/XXXXXX-update-berita-for-multilanguage.js
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Hapus kolom yang akan dipindah ke translation table
    await queryInterface.removeColumn("berita", "judul");
    await queryInterface.removeColumn("berita", "isi");

    // Buat tabel berita_translations
    await queryInterface.createTable("berita_translations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      berita_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "berita",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      language_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "languages",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      judul: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      isi: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      meta_title: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      meta_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    // Tambahkan unique constraint
    await queryInterface.addConstraint("berita_translations", {
      fields: ["berita_id", "language_id"],
      type: "unique",
      name: "unique_berita_language",
    });

    // Tambahkan index untuk performa
    await queryInterface.addIndex("berita_translations", ["language_id"]);
    await queryInterface.addIndex("berita_translations", ["berita_id"]);
    await queryInterface.addIndex("berita_translations", ["slug"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("berita_translations");

    // Kembalikan kolom (perlu data migration manual)
    await queryInterface.addColumn("berita", "judul", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn("berita", "isi", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
};
```

## 3. Model Language

```javascript
// models/Language.js
module.exports = (sequelize, DataTypes) => {
  const Language = sequelize.define(
    "Language",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING(5),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "languages",
      timestamps: true,
      underscored: false,
    }
  );

  Language.associate = function (models) {
    // Associations akan ditambahkan di model translation
  };

  return Language;
};
```

## 4. Model Berita (Updated)

```javascript
// models/berita.js
module.exports = (sequelize, DataTypes) => {
  const Berita = sequelize.define(
    "Berita",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      foto: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_published: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "berita",
      timestamps: true,
      underscored: false,
    }
  );

  Berita.associate = function (models) {
    Berita.hasMany(models.FotoBerita, {
      foreignKey: "beritaId",
      as: "fotos",
    });

    // Association dengan translations
    Berita.hasMany(models.BeritaTranslation, {
      foreignKey: "berita_id",
      as: "translations",
    });
  };

  // Scope untuk get dengan bahasa tertentu
  Berita.addScope("withLanguage", (languageCode = "id") => {
    return {
      include: [
        {
          model: sequelize.models.BeritaTranslation,
          as: "translations",
          where: {
            language_id: sequelize.literal(
              `(SELECT id FROM languages WHERE code = '${languageCode}' LIMIT 1)`
            ),
          },
          required: false,
        },
        {
          model: sequelize.models.FotoBerita,
          as: "fotos",
          separate: true,
          order: [["urutan", "ASC"]],
        },
      ],
    };
  });

  // Scope untuk get dengan fallback ke default language
  Berita.addScope("withLanguageFallback", (languageCode = "id") => {
    return {
      include: [
        {
          model: sequelize.models.BeritaTranslation,
          as: "translations",
          where: {
            language_id: sequelize.literal(
              `(SELECT id FROM languages WHERE code = '${languageCode}' LIMIT 1)`
            ),
          },
          required: false,
        },
        {
          model: sequelize.models.BeritaTranslation,
          as: "defaultTranslation",
          where: {
            language_id: sequelize.literal(
              `(SELECT id FROM languages WHERE is_default = TRUE LIMIT 1)`
            ),
          },
          required: false,
        },
        {
          model: sequelize.models.FotoBerita,
          as: "fotos",
          separate: true,
          order: [["urutan", "ASC"]],
        },
      ],
    };
  });

  return Berita;
};
```

## 5. Model BeritaTranslation

```javascript
// models/BeritaTranslation.js
module.exports = (sequelize, DataTypes) => {
  const BeritaTranslation = sequelize.define(
    "BeritaTranslation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      berita_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "berita",
          key: "id",
        },
      },
      language_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "languages",
          key: "id",
        },
      },
      judul: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      isi: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      meta_title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      meta_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "berita_translations",
      timestamps: true,
      underscored: false,
    }
  );

  BeritaTranslation.associate = function (models) {
    BeritaTranslation.belongsTo(models.Berita, {
      foreignKey: "berita_id",
      as: "berita",
    });
    BeritaTranslation.belongsTo(models.Language, {
      foreignKey: "language_id",
      as: "language",
    });
  };

  return BeritaTranslation;
};
```

## 6. Update Controller dengan Multi-Language

```javascript
// controllers/beritaControllers.js (contoh update)
const { Berita, BeritaTranslation, Language } = require("../models");
const { Op } = require("sequelize");

// Helper function untuk get language ID
const getLanguageId = async (code = "id") => {
  const language = await Language.findOne({ where: { code } });
  return language ? language.id : null;
};

// Get all berita dengan bahasa tertentu
const getAllBerita = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const lang =
      req.query.lang || req.headers["accept-language"]?.split(",")[0] || "id";

    const where = {};
    if (search) {
      where[Op.or] = [
        { "$translations.judul$": { [Op.like]: `%${search}%` } },
        { "$translations.isi$": { [Op.like]: `%${search}%` } },
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
          where: {
            language_id: sequelize.literal(
              `(SELECT id FROM languages WHERE code = '${lang}' LIMIT 1)`
            ),
          },
          required: true,
        },
        {
          model: FotoBerita,
          as: "fotos",
          separate: true,
          order: [["urutan", "ASC"]],
        },
      ],
    });

    // Format response
    const formattedData = rows.map((berita) => ({
      id: berita.id,
      slug: berita.slug || berita.translations[0]?.slug,
      foto: berita.foto,
      judul: berita.translations[0]?.judul,
      isi: berita.translations[0]?.isi,
      language: lang,
      fotos: berita.fotos,
    }));

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

// Create berita dengan multi-language
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

    const hasDefaultTranslation = translations?.some(
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
    if (!finalSlug && translations && translations.length > 0) {
      const defaultTranslation = translations.find(
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

    // Create berita
    const berita = await Berita.create({
      slug: finalSlug,
      foto: foto || (req.file ? `/uploads/berita/${req.file.filename}` : null),
      is_published: true,
    });

    // Create translations
    if (translations && translations.length > 0) {
      const translationPromises = translations.map(async (trans) => {
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
    }

    // Reload dengan translations
    const beritaWithTranslations = await Berita.findByPk(berita.id, {
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
      data: beritaWithTranslations,
    });
  } catch (error) {
    console.error("Error in createBerita:", error);
    next(error);
  }
};
```

## 7. Middleware untuk Detect Language

```javascript
// middleware/languageMiddleware.js
const { Language } = require("../models");

const languageMiddleware = async (req, res, next) => {
  // Priority: query param > header > default
  let langCode =
    req.query.lang ||
    req.headers["accept-language"]?.split(",")[0]?.split("-")[0] ||
    "id";

  // Validasi bahasa
  const language = await Language.findOne({
    where: { code: langCode, is_active: true },
  });

  if (!language) {
    // Fallback ke default language
    const defaultLang = await Language.findOne({
      where: { is_default: true, is_active: true },
    });
    req.language = defaultLang || { code: "id", id: 1 };
  } else {
    req.language = language;
  }

  next();
};

module.exports = languageMiddleware;
```

## 8. Update models/index.js

```javascript
// models/index.js
const { sequelize, Sequelize } = require("../database");

const db = {
  sequelize,
  Sequelize,
};

// Import dan inisialisasi models
db.User = require("./User")(sequelize, Sequelize.DataTypes);
db.Language = require("./Language")(sequelize, Sequelize.DataTypes);
db.Berita = require("./berita")(sequelize, Sequelize.DataTypes);
db.BeritaTranslation = require("./BeritaTranslation")(
  sequelize,
  Sequelize.DataTypes
);
db.FotoBerita = require("./FotoBerita")(sequelize, Sequelize.DataTypes);
db.Galeri = require("./galeri")(sequelize, Sequelize.DataTypes);
db.RekamJejak = require("./rekamJejak")(sequelize, Sequelize.DataTypes);

// Define associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
```

## Contoh Request Body untuk Create Berita

```json
{
  "slug": "berita-1",
  "foto": "/uploads/berita/image.jpg",
  "translations": [
    {
      "language_code": "id",
      "judul": "Judul Berita dalam Bahasa Indonesia",
      "isi": "Isi berita dalam bahasa Indonesia...",
      "slug": "berita-1-id",
      "meta_title": "Meta Title ID",
      "meta_description": "Meta Description ID"
    },
    {
      "language_code": "en",
      "judul": "News Title in English",
      "isi": "News content in English...",
      "slug": "berita-1-en",
      "meta_title": "Meta Title EN",
      "meta_description": "Meta Description EN"
    }
  ]
}
```

## Catatan Implementasi

1. **Migration Strategy**:

   - Buat migration untuk tabel languages terlebih dahulu
   - Lalu update tabel berita dan buat tabel translations
   - Untuk data existing, perlu data migration manual

2. **Backward Compatibility**:

   - Jika ada data existing, perlu migrasi data dari kolom lama ke tabel translation
   - Buat script migration data terpisah

3. **API Endpoints**:

   - Tambahkan parameter `?lang=id` atau `?lang=en` di semua endpoint
   - Atau gunakan header `Accept-Language`

4. **Validation**:
   - Pastikan setiap create/update memiliki terjemahan untuk bahasa default
   - Validasi bahwa language_code yang dikirim valid
