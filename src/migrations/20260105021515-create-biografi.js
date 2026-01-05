"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("biografi", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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

    // Buat tabel biografi_translations
    await queryInterface.createTable("biografi_translations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      biografi_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "biografi",
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
      slogan: {
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
    await queryInterface.addConstraint("biografi_translations", {
      fields: ["biografi_id", "language_id"],
      type: "unique",
      name: "unique_biografi_language",
    });

    // Tambahkan index untuk performa
    await queryInterface.addIndex("biografi_translations", ["language_id"]);
    await queryInterface.addIndex("biografi_translations", ["biografi_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("biografi_translations");
    await queryInterface.dropTable("biografi");
  },
};
