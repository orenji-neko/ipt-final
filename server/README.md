# Server Documentation

This is the backend server for the IPT Final Project. It's built with Node.js and Express, using MySQL as the database.

## Prerequisites

Before running the server, make sure you have the following installed:
- Node.js (v14 or higher)
- MySQL Server
- npm (Node Package Manager)

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Create a `.env` file in the server root directory
   - Add the following environment variables:
     ```
     NODE_ENV=development
     PORT=4000
     DATABASE_URL=mysql://user:password@localhost:3306/database_name
     JWT_SECRET=your-secret-key
     ```
   Replace the database URL parameters with your MySQL credentials.

3. **Database Setup**
   - Create a MySQL database
   - The application will automatically create the required tables on first run

## Running the Server

1. **Development Mode**
   ```bash
   npm start
   ```
   This will start the server on port 4000 (default) or the port specified in your .env file.

2. **API Documentation**
   - Once the server is running, you can access the Swagger documentation at:
   ```
   http://localhost:4000/api-docs
   ```

## Project Structure

- `server.js` - Main application entry point
- `config.json` - Application configuration
- `swagger.yaml` - API documentation
- `/accounts` - User authentication and account management
- `/departments` - Department management endpoints
- `/employees` - Employee management endpoints
- `/requests` - Request management endpoints
- `/_middleware` - Express middleware functions
- `/_helpers` - Utility functions and helpers

## Features

- JWT Authentication
- Role-based access control
- RESTful API endpoints
- MySQL database integration
- Swagger API documentation
- Email notifications (via nodemailer)

## API Endpoints

The server provides various endpoints for:
- User Authentication
- Department Management
- Employee Management
- Request Management
- Workflow Management

For detailed API documentation, please refer to the Swagger documentation when the server is running.

## Error Handling

The server implements comprehensive error handling:
- Validation errors
- Authentication errors
- Database errors
- General server errors

All errors are returned in a consistent format with appropriate HTTP status codes.
