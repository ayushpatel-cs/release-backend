// migrations/YYYYMMDDHHMMSS-add-date-fields-to-bids.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Bids', 'start_date', {
      type: Sequelize.DATE,
      allowNull: true  // Setting to true initially to handle existing records
    });

    await queryInterface.addColumn('Bids', 'end_date', {
      type: Sequelize.DATE,
      allowNull: true  // Setting to true initially to handle existing records
    });

    // After adding columns, update existing records with a default value if needed
    await queryInterface.sequelize.query(`
      UPDATE "Bids" 
      SET start_date = created_at,
          end_date = created_at + INTERVAL '30 days'
      WHERE start_date IS NULL;
    `);

    // Now make the columns required
    await queryInterface.changeColumn('Bids', 'start_date', {
      type: Sequelize.DATE,
      allowNull: false
    });

    await queryInterface.changeColumn('Bids', 'end_date', {
      type: Sequelize.DATE,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Bids', 'start_date');
    await queryInterface.removeColumn('Bids', 'end_date');
  }
};