"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pesan", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nama: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      kontak: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      judul: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      pesan: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("new", "read", "replied"),
        defaultValue: "new",
        allowNull: false,
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

    // Tambahkan index untuk performa
    await queryInterface.addIndex("pesan", ["status"]);
    await queryInterface.addIndex("pesan", ["email"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("pesan");
  },
};
