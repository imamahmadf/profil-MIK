"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
        references: {
          model: "berita",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("foto_berita");
  },
};
