"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Cek apakah tabel berita sudah ada dan kolom foto belum ada
    try {
      const tableDescription = await queryInterface.describeTable("berita");

      // Jika tabel ada dan kolom foto belum ada, tambahkan kolom
      if (!tableDescription.foto) {
        await queryInterface.addColumn("berita", "foto", {
          type: Sequelize.STRING,
          allowNull: true,
          after: "slug",
        });
      }
    } catch (error) {
      // Jika tabel belum ada, skip penambahan kolom (akan ditambahkan di migration create-berita atau setelahnya)
      console.log(
        "Tabel berita belum ditemukan, skip penambahan kolom foto:",
        error.message
      );
    }
  },

  async down(queryInterface, Sequelize) {
    // Cek apakah tabel berita masih ada sebelum menghapus kolom
    try {
      await queryInterface.describeTable("berita");
      // Jika tabel ada, hapus kolom
      await queryInterface.removeColumn("berita", "foto");
    } catch (error) {
      // Jika tabel tidak ada, skip penghapusan kolom
      console.log(
        "Tabel berita tidak ditemukan, skip penghapusan kolom foto:",
        error.message
      );
    }
  },
};
