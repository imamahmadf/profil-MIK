"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Cek apakah kolom satuan ada di tabel fakta_unik
    const faktaUnikDescription = await queryInterface.describeTable("fakta_unik");
    // Cek apakah kolom satuan sudah ada di tabel fakta_unik_translations
    const translationDescription = await queryInterface.describeTable("fakta_unik_translations");

    if (faktaUnikDescription.satuan) {
      // Migrasi data existing: simpan data satuan ke temporary
      const [existingData] = await queryInterface.sequelize.query(
        "SELECT id, satuan FROM fakta_unik WHERE satuan IS NOT NULL"
      );

      // Tambahkan kolom satuan ke tabel fakta_unik_translations hanya jika belum ada
      if (!translationDescription.satuan) {
        await queryInterface.addColumn("fakta_unik_translations", "satuan", {
          type: Sequelize.STRING(50),
          allowNull: true,
        });
      }

      // Migrasi data satuan ke translations dengan bahasa default
      if (existingData && existingData.length > 0) {
        const defaultLanguage = await queryInterface.sequelize.query(
          "SELECT id FROM languages WHERE is_default = true LIMIT 1",
          { type: Sequelize.QueryTypes.SELECT }
        );

        if (defaultLanguage && defaultLanguage.length > 0) {
          const langId = defaultLanguage[0].id;

          for (const fakta of existingData) {
            // Update translation yang sudah ada untuk bahasa default
            await queryInterface.sequelize.query(
              `UPDATE fakta_unik_translations 
               SET satuan = :satuan 
               WHERE fakta_unik_id = :fakta_id AND language_id = :lang_id`,
              {
                replacements: {
                  satuan: fakta.satuan,
                  fakta_id: fakta.id,
                  lang_id: langId,
                },
              }
            );
          }
        }
      }

      // Hapus kolom satuan dari tabel fakta_unik
      await queryInterface.removeColumn("fakta_unik", "satuan");
    } else {
      // Jika kolom satuan belum ada di tabel utama, tambahkan ke translation hanya jika belum ada
      if (!translationDescription.satuan) {
        await queryInterface.addColumn("fakta_unik_translations", "satuan", {
          type: Sequelize.STRING(50),
          allowNull: true,
        });
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Kembalikan kolom satuan ke tabel fakta_unik
    const tableDescription = await queryInterface.describeTable(
      "fakta_unik_translations"
    );

    if (tableDescription.satuan) {
      // Tambahkan kolom satuan kembali ke tabel fakta_unik
      await queryInterface.addColumn("fakta_unik", "satuan", {
        type: Sequelize.STRING(50),
        allowNull: true,
      });

      // Migrasi data satuan dari translation ke tabel utama (ambil dari default language)
      const defaultLanguage = await queryInterface.sequelize.query(
        "SELECT id FROM languages WHERE is_default = true LIMIT 1",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (defaultLanguage && defaultLanguage.length > 0) {
        const langId = defaultLanguage[0].id;

        await queryInterface.sequelize.query(
          `UPDATE fakta_unik fu
           INNER JOIN fakta_unik_translations fut ON fu.id = fut.fakta_unik_id
           SET fu.satuan = fut.satuan
           WHERE fut.language_id = :lang_id AND fut.satuan IS NOT NULL`,
          {
            replacements: { lang_id: langId },
          }
        );
      }

      // Hapus kolom satuan dari tabel translation
      await queryInterface.removeColumn("fakta_unik_translations", "satuan");
    }
  },
};
