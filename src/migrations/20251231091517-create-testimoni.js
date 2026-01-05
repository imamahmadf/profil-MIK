"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("testimoni", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      foto: {
        type: Sequelize.STRING,
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

    // Buat tabel testimoni_translations
    await queryInterface.createTable("testimoni_translations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      testimoni_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "testimoni",
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
      nama: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      isi: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      tempat: {
        type: Sequelize.STRING(255),
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
    await queryInterface.addConstraint("testimoni_translations", {
      fields: ["testimoni_id", "language_id"],
      type: "unique",
      name: "unique_testimoni_language",
    });

    // Tambahkan index untuk performa
    await queryInterface.addIndex("testimoni_translations", ["language_id"]);
    await queryInterface.addIndex("testimoni_translations", ["testimoni_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("testimoni_translations");
    await queryInterface.dropTable("testimoni");
  },
};
