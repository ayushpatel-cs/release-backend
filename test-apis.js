
const axios = require('axios');

// 1. Create User
axios.post('http://localhost:3000/users', {
  name: 'John Doe',
  email: 'john.doe@example.com',
  password_hash: 'securepasswordhash',
  role: 'user'
})
  .then(response => {
    console.log('User Created:', response.data);
  })
  .catch(error => {
    console.error('Error creating user:', error);
  });

// 2. Update User Information
axios.put('http://localhost:3000/users/1', {
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  password_hash: 'newpasswordhash',
  profile_picture_url: 'http://example.com/profile.jpg',
  role: 'admin'
})
  .then(response => {
    console.log('User Updated:', response.data);
  })
  .catch(error => {
    console.error('Error updating user:', error);
  });

// 3. Get All Listings (with Pagination and Filtering)
axios.get('http://localhost:3000/listings', {
  params: {
    page: 1,
    limit: 10,
    sort_by: 'date_posted',
    order: 'DESC',
    price_min: 100,
    price_max: 1000,
    city: 'Atlanta',
    state: 'GA'
  }
})
  .then(response => {
    console.log('Listings:', response.data);
  })
  .catch(error => {
    console.error('Error getting listings:', error);
  });

// 4. Create Listing
axios.post('http://localhost:3000/listings', {
  user_id: 1,
  title: 'Apartment for Rent',
  description: 'A spacious apartment available for sublet',
  price: 1200,
  address: '123 Main St',
  city: 'Atlanta',
  state: 'GA',
  zip_code: '30303',
  available_from: '2024-11-01',
  available_to: '2025-03-01'
})
  .then(response => {
    console.log('Listing Created:', response.data);
  })
  .catch(error => {
    console.error('Error creating listing:', error);
  });

// 5. Get Listing by ID
axios.get('http://localhost:3000/listings/1')
  .then(response => {
    console.log('Listing:', response.data);
  })
  .catch(error => {
    console.error('Error getting listing:', error);
  });

// 6. Delete Listing by ID
axios.delete('http://localhost:3000/listings/1')
  .then(response => {
    console.log('Listing Deleted:', response.data);
  })
  .catch(error => {
    console.error('Error deleting listing:', error);
  });

// 7. Update Listing by ID
axios.put('http://localhost:3000/listings/1', {
  title: 'Updated Apartment for Rent',
  description: 'Updated spacious apartment available for sublet',
  price: 1300,
  address: '456 Another St',
  city: 'Atlanta',
  state: 'GA',
  zip_code: '30304',
  available_from: '2024-12-01',
  available_to: '2025-04-01'
})
  .then(response => {
    console.log('Listing Updated:', response.data);
  })
  .catch(error => {
    console.error('Error updating listing:', error);
  });