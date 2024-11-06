'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'location', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'languages', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: [],
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'occupation', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'education', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'pets_preference', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'bio');
    await queryInterface.removeColumn('Users', 'phone');
    await queryInterface.removeColumn('Users', 'location');
    await queryInterface.removeColumn('Users', 'languages');
    await queryInterface.removeColumn('Users', 'occupation');
    await queryInterface.removeColumn('Users', 'education');
    await queryInterface.removeColumn('Users', 'pets_preference');
  }
};