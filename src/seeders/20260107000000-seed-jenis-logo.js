"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("jenis_logo", [
      {
        nama: "Kepeloporan dan Ketokohan",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nama: "Keahlian Korporat dan Profesional​",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nama: "Keterlibatan Internasional​",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
     
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("jenis_logo", {
      nama: [
        "Logo Utama",
        "Logo Sekunder",
        "Logo Footer",
        "Logo Favicon",
        "Logo Partner",
        "Logo Sponsor",
      ],
    });
  },
};

