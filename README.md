# ReLease Backend

Backend server for the ReLease application - a platform for subleasing properties with an open-auction-based system.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- Google Maps API Key (for geocoding)

## Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Variables**
Create a `.env` file in the root directory:
```
# Database
DB_HOST=your-db-host
DB_PORT=25060
DB_NAME=defaultdb
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# JWT
JWT_SECRET=your-secure-secret-key

# App
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
BACKEND_URL=http://localhost:3001

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

3. **Database Setup**
```bash
# Run migrations
npx sequelize-cli db:migrate
```

## Running the Server

### Development
```bash
# Start with nodemon for development
npm run dev
```

### Production
```bash
# Start for production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
  - Body: `{ email, password, name, phone }`
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
- `POST /api/auth/verify` - Verify email/phone
  - Body: `{ type, code }`
  - Protected: Requires authentication

### Properties
- `GET /api/properties` - List properties
  - Query params: `page`, `limit`, `search`, `minPrice`, `maxPrice`, `city`, `state`
- `POST /api/properties` - Create property listing
  - Body: Multipart form data with property details and images
  - Protected: Requires authentication
- `GET /api/properties/:id` - Get property details
- `PUT /api/properties/:id` - Update property
  - Body: Multipart form data with updated details
  - Protected: Requires authentication
- `DELETE /api/properties/:id` - Delete property
  - Protected: Requires authentication
- `GET /api/properties/address-suggestions` - Get address autocomplete suggestions
  - Query params: `input`
- `GET /api/properties/validate-address` - Validate address details
  - Query params: `placeId`

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update user profile
  - Protected: Requires authentication
- `PUT /api/users/profile/image` - Update profile image
  - Body: Multipart form data with image
  - Protected: Requires authentication
- `GET /api/users/:id/properties` - Get user's property listings
- `GET /api/users/:id/bids` - Get user's bid history
  - Protected: Requires authentication

### Bids
- `GET /api/bids/properties/:id/bids` - Get property bids
- `POST /api/bids/properties/:id/bids` - Place new bid
  - Body: `{ amount, start_date, end_date }`
  - Protected: Requires authentication
- `POST /api/bids/properties/:id/select-winner` - Select winning bid
  - Body: `{ bid_id }`
  - Protected: Requires authentication

### Images
- `POST /api/uploads/properties/:id/images` - Upload property images
  - Body: Multipart form data with images
  - Protected: Requires authentication
- `PUT /api/uploads/properties/:id/images/reorder` - Reorder images
  - Body: `{ image_orders: [{ id, order_index }] }`
  - Protected: Requires authentication


## Development Commands

```bash
# Run server with nodemon
npm run dev

# Run database migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Create new migration
npx sequelize-cli migration:generate --name migration-name
```

## Project Structure
release-backend/
├── config/             # Database configuration
├── middleware/         # Express middleware
│   └── auth.js         # Authentication middleware
├── models/             # Sequelize models
├── routes/             # API routes
├── utils/              # Utility functions
│   ├── auth.js         # Authentication utilities
│   ├── upload.js       # File upload utilities
│   └── geocoding.js    # Google Maps integration
├── uploads/            # Local file uploads (temporary, should ideally be replaced with cloud storage like AWS S3)
├── .env                # Environment variables
└── server.js           # Entry point

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Testing API Endpoints

You can use tools like Postman or curl to test the API endpoints. Here's a sample curl command:

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## License