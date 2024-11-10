'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Sample Georgia Tech area properties
    const properties = [
      {
        user_id: 2,
        title: 'Cozy Tech Square Apartment',
        description: 'Modern apartment near Georgia Tech campus',
        address_line1: '771 Spring St NW',
        city: 'Atlanta',
        state: 'GA',
        zip_code: '30308',
        formatted_address: '771 Spring St NW, Atlanta, GA 30308',
        latitude: 33.7756,
        longitude: -84.3893,
        place_id: 'ChIJjQmTaJQE9YgRC2s',
        min_price: 1200.00,
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 2,
        title: 'Midtown Studio near Campus',
        description: 'Perfect for students',
        address_line1: '848 Spring St NW',
        city: 'Atlanta',
        state: 'GA',
        zip_code: '30308',
        formatted_address: '848 Spring St NW, Atlanta, GA 30308',
        latitude: 33.7767,
        longitude: -84.3883,
        place_id: 'ChIJjQmTaJQE9YgRC2t',
        min_price: 1000.00,
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 2,
        title: 'Home Park House',
        description: 'Spacious house in Home Park',
        address_line1: '1015 Northside Dr NW',
        city: 'Atlanta',
        state: 'GA',
        zip_code: '30318',
        formatted_address: '1015 Northside Dr NW, Atlanta, GA 30318',
        latitude: 33.7816,
        longitude: -84.4063,
        place_id: 'ChIJjQmTaJQE9YgRC2u',
        min_price: 2000.00,
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('Properties', properties, {});
},

down: async (queryInterface, Sequelize) => {
  await queryInterface.bulkDelete('Properties', null, {});
}
};