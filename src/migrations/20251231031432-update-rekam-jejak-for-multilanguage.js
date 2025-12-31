"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Migrasi data existing: simpan data judul dan isi ke temporary
    const [existingData] = await queryInterface.sequelize.query(
      "SELECT id, judul, isi FROM rekam_jejak"
    );

    // Hapus kolom yang akan dipindah ke translation table
    await queryInterface.removeColumn("rekam_jejak", "judul");
    await queryInterface.removeColumn("rekam_jejak", "isi");

    // Buat tabel rekam_jejak_translations
    await queryInterface.createTable("rekam_jejak_translations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      rekam_jejak_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "rekam_jejak",
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
    await queryInterface.addConstraint("rekam_jejak_translations", {
      fields: ["rekam_jejak_id", "language_id"],
      type: "unique",
      name: "unique_rekam_jejak_language",
    });

    // Tambahkan index untuk performa
    await queryInterface.addIndex("rekam_jejak_translations", ["language_id"]);
    await queryInterface.addIndex("rekam_jejak_translations", [
      "rekam_jejak_id",
    ]);
    await queryInterface.addIndex("rekam_jejak_translations", ["slug"]);

    // Migrasi data existing ke rekam_jejak_translations dengan bahasa default (id)
    if (existingData && existingData.length > 0) {
      const defaultLanguage = await queryInterface.sequelize.query(
        "SELECT id FROM languages WHERE code = 'id' LIMIT 1",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (defaultLanguage && defaultLanguage.length > 0) {
        const langId = defaultLanguage[0].id;
        const translations = existingData.map((rekamJejak) => ({
          rekam_jejak_id: rekamJejak.id,
          language_id: langId,
          judul: rekamJejak.judul || "Untitled",
          isi: rekamJejak.isi || "",
          slug: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        if (translations.length > 0) {
          await queryInterface.bulkInsert(
            "rekam_jejak_translations",
            translations
          );
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Hapus tabel translations
    try {
      await queryInterface.dropTable("rekam_jejak_translations");
    } catch (error) {
      console.log(
        "Tabel rekam_jejak_translations tidak ditemukan:",
        error.message
      );
    }

    // Cek apakah tabel rekam_jejak masih ada sebelum memodifikasi kolom
    try {
      await queryInterface.describeTable("rekam_jejak");

      // Kembalikan kolom (perlu data migration manual dari rekam_jejak_translations)
      await queryInterface.addColumn("rekam_jejak", "judul", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
      await queryInterface.addColumn("rekam_jejak", "isi", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    } catch (error) {
      console.log(
        "Tabel rekam_jejak tidak ditemukan, skip modifikasi kolom:",
        error.message
      );
    }
  },
};
