import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";

// Load environment variables
configDotenv();
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, RESET_PASSWORD_SECRET } = process.env;

// Function to generate a JWT token (Access, Refresh, or Reset) with an expiration time
export const generateJWTToken = (user, type, time) => {
    return jwt.sign({ id: user._id }, type === 'access' ? ACCESS_TOKEN_SECRET : type === 'reset' ? RESET_PASSWORD_SECRET : REFRESH_TOKEN_SECRET, { expiresIn: time || "15m" });
};

// Function to verify a JWT token
export const verifyJWTToken = (token, type) => {
    const decoded = jwt.verify(token, type === 'access' ? ACCESS_TOKEN_SECRET : type === 'reset' ? RESET_PASSWORD_SECRET : REFRESH_TOKEN_SECRET);
    return decoded
};

// Function to check if the token has expired based on its `exp` field
export const isTokenExpired = (decodedToken) => {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    return decodedToken.exp < currentTimestamp;
};