'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Enable PostGIS extension if not enabled
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    
    // Add spatial index to properties table
    await queryInterface.sequelize.query(`
      CREATE INDEX properties_location_idx 
      ON properties 
      USING GIST (ST_MakePoint(longitude, latitude)::geography);
    `);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS properties_location_idx;');
  }
};