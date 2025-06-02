# Chef Management & Dashboard Analytics - Backend

## 🚀 Overview

This backend powers the core logic for managing chefs and delivering comprehensive dashboard analytics. Built with Node.js and Express, it handles CRUD operations for chefs, ensures data validation, and aggregates key business metrics such as orders, revenue, and table availability. Data persistence is managed via MongoDB.

## ✨ Features

### 🍳 Chef Management

- Retrieve the full list of chefs with their roles and order counts.
- Add new chefs with uniqueness validation on names.
- Delete chefs with safeguards preventing removal of admin chefs.

### 📊 Dashboard Analytics

- Aggregate analytics including:
  - Total chefs, clients, and orders
  - Total revenue generated
  - Number of tables available and booked for the current day
- Provides valuable insights for restaurant management.

### ⚙️ Error Handling & Validation

- Uses a custom error class (`CustomError`) for consistent error reporting.
- Standardized HTTP status codes returned via `RouteCode`.
- Input validation for secure and reliable API operations.

## 🧱 Tech Stack

### Backend

- **Node.js**
- **Express.js**
- **MongoDB** (Database)

### Additional Tools

- **Mongoose** - ODM for MongoDB interactions.
- **CustomError** - Custom error handling utility.

## 📦 Installation

To set up and run the backend locally, follow these steps:

```sh
# Clone the repository
git clone https://github.com/var-shikhar/BE-hotel-management-cuvette.git
cd BE-hotel-management-cuvette

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env file to add your config values

# Start the development server
npm run dev
```

## 🧩 Usage & Code Structure

### 📁 Modular Architecture

**Organized into:**

- /routes – API routes
- /controllers – Business logic handlers
- /models – Mongoose schemas
- /middleware – Authentication, error handling, etc.
- /utils – Helper functions and logging utilities

### 📄 Logging System

- Uses winston to log:
  - Errors
  - Unexpected behavior
  - Critical application events
- Logs are saved in a dedicated /logs folder for debugging and monitoring.

## Environment Variables

Ensure you configure the `.env` file with the required credentials:

```env
PORT=your_backend_port
FRONTEND_PORT=your_frontend_port
DEV_FRONTEND_PORT=your_dev_frontend_port
RENDER_FRONTEND_PORT=your_render_frontend_port
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
SALT=your_salt_value
NODE_ENV=development_or_production

ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
RESET_PASSWORD_SECRET=your_reset_password_secret
```

## 📬 Contact

For more details, reach out to:

**Shikhar Varshney**  
📧 Email: [shikharvarshney10@gmail.com](mailto:shikharvarshney10@gmail.com)
