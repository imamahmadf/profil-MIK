"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("berita", "foto", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "slug",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("berita", "foto");
  },
};
