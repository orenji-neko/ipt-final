# Server Documentation

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen.svg)](https://nodejs.org/en/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

This is the backend server for the IPT Final Project. It's built with Node.js and Express, using MySQL as the database.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Server](#running-the-server)
- [Project Structure](#project-structure)
- [Features](#features)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

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
   - Create a `config.json` file in the server root directory
   - Add the following environment variables:
     ```json
     {
         "database": {
            "host": "YOUR_DB_HOST",
            "port": 3306, 
            "user": "YOUR_DB_USER", 
            "password": "YOUR_DB_PASSWORD", 
            "database": "YOUR_DB_NAME"
         },
         "database_production": {
            "host": "YOUR_DB_HOST",
            "port": 3306, 
            "user": "YOUR_DB_USER", 
            "password": "YOUR_DB_PASSWORD", 
            "database": "YOUR_DB_NAME"
         },
         "secret": "YOUR_JWT_SECRET_KEY",
         "emailFrom": "your-email@domain.com",
         "smtpOptions": {
            "host": "YOUR_SMTP_HOST",
            "port": 587,
            "auth": {
               "user": "YOUR_SMTP_USER",
               "pass": "YOUR_SMTP_PASSWORD"
            }
         },
         "cors": {
            "origin": "https://YOUR-CLIENT-PAGE.com",
            "credentials": true,
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "allowedHeaders": ["Content-Type", "Authorization"]
         }
     }
     ```

3. **Database Setup**
   - Create a MySQL database
   - The application will automatically create the required tables on first run

## Running the Server

1. **Development Mode**
   ```bash
   npm start
   ```
   This will start the server on port 4000.

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

- JWT Authentication with refresh tokens
- Role-based access control (Admin/User roles)
- RESTful API endpoints
- MySQL database integration with Sequelize ORM
- Swagger API documentation
- Email notifications for account verification
- CORS support with specific origin configuration

## API Endpoints

The server provides various endpoints for:
- User Authentication (login, register, verify email)
- Department Management
- Employee Management
- Request Management
- Workflow Management

For detailed API documentation, please refer to the Swagger documentation when the server is running.

## Error Handling

The server implements comprehensive error handling:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Database errors (500)
- General server errors (500)

All errors are returned in a consistent format:
```json
{
    "message": "Error description",
    "status": 400
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Troubleshooting

Common issues and solutions:

1. **Database Connection Issues**
   - Verify MySQL service is running
   - Check credentials in config.json
   - Ensure database exists and user has proper permissions

2. **Email Sending Fails**
   - Verify SMTP credentials
   - Check if SMTP server is accessible
   - Ensure proper email format

3. **Performance Issues**
   - Check server logs for bottlenecks
   - Monitor database query performance
   - Verify system resources (CPU, Memory)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
