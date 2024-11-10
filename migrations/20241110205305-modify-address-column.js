'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Properties', 'address');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Properties', 'address', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};
