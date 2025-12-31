"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("berita", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      judul: {
        type: Sequelize.STRING,
      },
      isi: {
        type: Sequelize.TEXT,
      },
      slug: {
        type: Sequelize.TEXT,
      },
      foto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Jika tabel foto_berita sudah ada, tambahkan foreign key constraint
    try {
      await queryInterface.describeTable("foto_berita");
      // Cek apakah constraint sudah ada
      const results = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM information_schema.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'foto_berita' 
         AND REFERENCED_TABLE_NAME = 'berita'
         LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (!results || results.length === 0) {
        // Constraint belum ada, tambahkan
        await queryInterface.addConstraint("foto_berita", {
          fields: ["beritaId"],
          type: "foreign key",
          name: "foto_berita_ibfk_1",
          references: {
            table: "berita",
            field: "id",
          },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        });
      }
    } catch (error) {
      // Tabel foto_berita belum ada, tidak perlu menambahkan constraint
      console.log(
        "Tabel foto_berita belum ada, skip penambahan foreign key:",
        error.message
      );
    }
  },
  async down(queryInterface, Sequelize) {
    // Hapus foreign key constraint dari foto_berita jika ada
    try {
      const results = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM information_schema.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'foto_berita' 
         AND REFERENCED_TABLE_NAME = 'berita'
         LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (results && results.length > 0 && results[0].CONSTRAINT_NAME) {
        const constraintName = results[0].CONSTRAINT_NAME;
        await queryInterface.sequelize.query(
          `ALTER TABLE foto_berita DROP FOREIGN KEY \`${constraintName}\``
        );
      }
    } catch (error) {
      // Jika tabel foto_berita tidak ada atau constraint tidak ditemukan, lanjutkan
      console.log(
        "Foreign key constraint tidak ditemukan atau sudah dihapus:",
        error.message
      );
    }

    await queryInterface.dropTable("berita");
  },
};
