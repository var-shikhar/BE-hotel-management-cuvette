# HUBLY - Backend

## 🚀 Overview

The backend of Hubly powers the core logic behind the chatbot interface, admin dashboard, team management, and analytics. Built with Node.js and Express, it facilitates secure user authentication, message logging, chatbot customization, and team-level operations — all backed by MongoDB for persistence.

## ✨ Features

### 💬 Chat & Message Management

- Stores and retrieves chat messages between end-users and admins.
- Tracks missed chats and timestamps for response analytics.
- Provides REST APIs for message history and user sessions.

### 🧑‍💼 Admin & Team Management

- Handles authentication for admins and their child (team) accounts.
- Supports team-level management of chatbot settings and analytics.

### 🎛️ Chatbot Customization

- Stores and manages customizable fields:
  - Welcome messages
  - Placeholder texts
  - Submit button label
  - Chat widget colors

### 📊 Analytics Tracking

- Captures metrics for:
  - Missed chats
  - First response time

## 🧱 Tech Stack

### Backend

- **Node.js**
- **Express.js**
- **MongoDB** (Database)

### Additional Tools

- **Winston** - For error logging and operational logs.
- **JWT** - For secure authentication and session management.
- **bcrypt** - For secure password hashing.

## 📦 Installation

Follow these steps to set up the backend locally:

```sh
# Clone the repository
git clone https://github.com/var-shikhar/Hubly-BE-Cuvette.git
cd Hubly-BE-Cuvette

# Install dependencies
npm install

# Copy environment variables template and configure settings
cp .env.example .env

# Start the backend server
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

### 🔐 Authentication & Security

- JWT-based access and refresh tokens for secure API access.
- Passwords hashed with bcrypt and a predefined salt.
- Refresh token management for extended sessions.

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
