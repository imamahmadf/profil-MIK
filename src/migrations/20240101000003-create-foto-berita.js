"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Buat tabel foto_berita tanpa foreign key constraint terlebih dahulu
    // Foreign key akan ditambahkan di migration create-berita setelah tabel berita dibuat
    await queryInterface.createTable("foto_berita", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      beritaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        // Foreign key constraint akan ditambahkan di migration create-berita
      },
      foto: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      urutan: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
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

    // Add index untuk performa query
    await queryInterface.addIndex("foto_berita", ["beritaId"]);

    // Cek apakah tabel berita sudah ada, jika ada tambahkan foreign key constraint
    try {
      await queryInterface.describeTable("berita");
      // Tabel berita sudah ada, tambahkan foreign key constraint
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
    } catch (error) {
      // Tabel berita belum ada, foreign key akan ditambahkan di migration create-berita
      console.log(
        "Tabel berita belum ada, foreign key akan ditambahkan nanti:",
        error.message
      );
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("foto_berita");
  },
};
