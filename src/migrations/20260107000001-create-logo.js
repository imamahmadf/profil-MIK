"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("logo", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      jenisLogoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "jenis_logo",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      gambarLogo: {
        type: Sequelize.STRING,
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
    await queryInterface.addIndex("logo", ["jenisLogoId"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("logo");
  },
};

