module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Properties', 'address_line1', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('Properties', 'address_line2', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('Properties', 'city', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('Properties', 'state', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('Properties', 'zip_code', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('Properties', 'formatted_address', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('Properties', 'place_id', {
      type: Sequelize.STRING
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Properties', 'address_line1');
    await queryInterface.removeColumn('Properties', 'address_line2');
    await queryInterface.removeColumn('Properties', 'city');
    await queryInterface.removeColumn('Properties', 'state');
    await queryInterface.removeColumn('Properties', 'zip_code');
    await queryInterface.removeColumn('Properties', 'formatted_address');
    await queryInterface.removeColumn('Properties', 'place_id');
  }
};