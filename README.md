# ReLease Backend

Backend server for the ReLease application - a platform for subleasing properties.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- AWS Account (for image uploads)

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

# AWS (required for image uploads)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# App
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

3. **Database Setup**
```bash
# Run migrations
npx sequelize-cli db:migrate

# (Optional) Run seeders if you want sample data
npx sequelize-cli db:seed:all
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
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify email/phone

### Properties
- `GET /api/properties` - List properties
- `POST /api/properties` - Create property listing
- `GET /api/properties/:id` - Get property details
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile

### Bids
- `GET /api/bids/properties/:id/bids` - Get property bids
- `POST /api/bids/properties/:id/select-winner` - Select winning bid

### Images
- `POST /api/uploads/properties/:id/images` - Upload property images
- `PUT /api/uploads/properties/:id/images/reorder` - Reorder images

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

# Run seeders
npx sequelize-cli db:seed:all

# Undo seeders
npx sequelize-cli db:seed:undo:all
```

## Project Structure

```
release-backend/
├── config/             # Database configuration
├── middleware/         # Express middleware
├── models/            # Sequelize models
├── routes/            # API routes
├── utils/             # Utility functions
├── uploads/           # Local file uploads (temporary)
├── .env               # Environment variables
└── server.js          # Entry point
```

## Testing API Endpoints

You can use tools like Postman or curl to test the API endpoints. Here's a sample curl command:

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## Contributing

1. Create a new branch
2. Make your changes
3. Submit a pull request

## License