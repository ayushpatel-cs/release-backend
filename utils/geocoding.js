const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const geocodingClient = {
  async getPlacePredictions(input) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        {
          params: {
            input,
            key: GOOGLE_MAPS_API_KEY,
            components: 'country:us', // Limit to US addresses
            types: 'address'
          }
        }
      );
      
      return response.data.predictions;
    } catch (error) {
      console.error('Error fetching place predictions:', error);
      throw error;
    }
  },

  async getPlaceDetails(placeId) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: GOOGLE_MAPS_API_KEY,
            fields: 'formatted_address,geometry,address_component'
          }
        }
      );

      const { result } = response.data;
      
      // Parse address components
      const addressComponents = {};
      result.address_components.forEach(component => {
        component.types.forEach(type => {
          addressComponents[type] = component.long_name;
        });
      });

      return {
        formatted_address: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        place_id: placeId,
        address_line1: `${addressComponents.street_number || ''} ${addressComponents.route || ''}`.trim(),
        city: addressComponents.locality || addressComponents.administrative_area_level_2,
        state: addressComponents.administrative_area_level_1,
        zip_code: addressComponents.postal_code
      };
    } catch (error) {
      console.error('Error fetching place details:', error);
      throw error;
    }
  }
};

module.exports = geocodingClient; 