"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Migrasi data existing: simpan data judul dan isi ke temporary
    const [existingData] = await queryInterface.sequelize.query(
      "SELECT id, judul, isi, slug FROM berita"
    );

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

    // Migrasi data existing ke berita_translations dengan bahasa default (id)
    if (existingData && existingData.length > 0) {
      const defaultLanguage = await queryInterface.sequelize.query(
        "SELECT id FROM languages WHERE code = 'id' LIMIT 1",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (defaultLanguage && defaultLanguage.length > 0) {
        const langId = defaultLanguage[0].id;
        const translations = existingData.map((berita) => ({
          berita_id: berita.id,
          language_id: langId,
          judul: berita.judul || "Untitled",
          isi: berita.isi || "",
          slug: berita.slug || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        if (translations.length > 0) {
          await queryInterface.bulkInsert("berita_translations", translations);
        }
      }
    }

    // Tambahkan kolom is_published jika belum ada
    const tableDescription = await queryInterface.describeTable("berita");
    if (!tableDescription.is_published) {
      await queryInterface.addColumn("berita", "is_published", {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Hapus tabel translations
    try {
      await queryInterface.dropTable("berita_translations");
    } catch (error) {
      console.log("Tabel berita_translations tidak ditemukan:", error.message);
    }

    // Cek apakah tabel berita masih ada sebelum memodifikasi kolom
    try {
      await queryInterface.describeTable("berita");

      // Kembalikan kolom (perlu data migration manual dari berita_translations)
      await queryInterface.addColumn("berita", "judul", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
      await queryInterface.addColumn("berita", "isi", {
        type: Sequelize.TEXT,
        allowNull: true,
      });

      // Hapus kolom is_published jika ada
      const tableDescription = await queryInterface.describeTable("berita");
      if (tableDescription.is_published) {
        await queryInterface.removeColumn("berita", "is_published");
      }
    } catch (error) {
      console.log(
        "Tabel berita tidak ditemukan, skip modifikasi kolom:",
        error.message
      );
    }
  },
};
