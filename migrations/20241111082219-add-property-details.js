'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Properties', 'bedrooms', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('Properties', 'bathrooms', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('Properties', 'type', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Apartment'
    });

    await queryInterface.addColumn('Properties', 'amenities', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: []
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Properties', 'bedrooms');
    await queryInterface.removeColumn('Properties', 'bathrooms');
    await queryInterface.removeColumn('Properties', 'type');
    await queryInterface.removeColumn('Properties', 'amenities');
  }
};
