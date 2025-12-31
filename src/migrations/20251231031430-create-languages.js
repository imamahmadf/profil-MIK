"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("languages", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      code: {
        type: Sequelize.STRING(5),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // Insert default languages
    await queryInterface.bulkInsert("languages", [
      {
        code: "id",
        name: "Indonesian",
        is_default: true,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        code: "en",
        name: "English",
        is_default: false,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        code: "ar",
        name: "Arabic",
        is_default: false,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        code: "ru",
        name: "Russian",
        is_default: false,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("languages");
  },
};
