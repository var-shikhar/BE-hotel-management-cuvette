/*
|--------------------------------------------------------------------------- 
| Server Setup and Middleware
|--------------------------------------------------------------------------- 
| Sets up the Express server, middleware (JSON parsing, cookie parsing, CORS), 
| connects to the database, and imports route handlers. Handles error middleware 
| and starts the server. Additionally includes security (Helmet), logging (Winston),
| data sanitization (MongoSanitize), and compression (Compression) for performance and security.
*/

import cookieParser from "cookie-parser";
import cors from "cors";
import { configDotenv } from 'dotenv';
import express from 'express';
import connectDB from './middleware/db.js';
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from 'express-mongo-sanitize';


configDotenv();
const { PORT, FRONTEND_PORT, RENDER_FRONTED_PORT, REMOTE_FRONTEND_PORT, DEV_FRONTEND_PORT } = process.env;
const SERVER_PORT = PORT || 3000;
const app = express();

// Connect to DB first before setting up the server
await connectDB();

// Security middleware
app.use(helmet());  // Helmet for security headers
app.use(mongoSanitize());  // Sanitizes inputs to avoid NoSQL injections

// Performance and parsing middleware
app.use(compression());  // Compress responses for better performance
app.use(express.json());  // Parse incoming JSON requests
app.use(cookieParser());  // Parse cookies for requests

// CORS middleware - make sure your origins are properly set
app.use(
    cors({
        origin: [FRONTEND_PORT, RENDER_FRONTED_PORT, REMOTE_FRONTEND_PORT, DEV_FRONTEND_PORT],
        credentials: true,
    })
);

import errorMiddleware from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from './routes/admin.js';

// Route handlers
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes)

// Error middleware should be the last middleware
app.use(errorMiddleware);


// Start the server after DB connection is successful
app.listen(SERVER_PORT, () => {
    console.log(`Server running on port ${SERVER_PORT}`);
});