/*
|--------------------------------------------------------------------------
| Authentication Middleware
|--------------------------------------------------------------------------
|
| This middleware ensures that users are authenticated before accessing 
| protected routes. It checks for the presence of an `accessToken` or `refreshToken` in cookies, validates them, and attaches user info to
| `req.user`. If no token is found or the token is invalid/expired, a 440  error is returned. (440 will automatically send a logout request (we've setup))

| - Access tokens are short-lived for secure, frequent API access.
| - Refresh tokens are used to obtain new access tokens without re-login.
| - Tokens are stored in HttpOnly cookies for security, with the `path`
|   attribute ensuring proper scope and minimizing exposure.
*/


import { configDotenv } from "dotenv";
import jwt from "jsonwebtoken";
import User from "../modal/user-modal.js";
import RouteCode from "../util/httpStatus.js";
import { generateJWTToken } from "../util/jwtToken.js";
import { CustomError } from "./errorMiddleware.js";

configDotenv();
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, NODE_ENV } = process.env;

// IsAuth Middlware for checking if the user is authenticated
const isAuth = (req, res, next) => {
    try {
        const accessToken = req.cookies.access_token;
        if (!accessToken) next(new CustomError("Something went wrong, Login again!", RouteCode.LOGOUT_REQESTED.statusCode));

        // Verify Access Token
        jwt.verify(accessToken, ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                if (err.name === "TokenExpiredError") return await handleTokenRefresh(req, res, next);
                return next(new CustomError("Something went wrong, Login again!", RouteCode.LOGOUT_REQESTED.statusCode));
            }

            if (!decoded || !decoded.id) return next(new CustomError("Something went wrong, Login again!", RouteCode.LOGOUT_REQESTED.statusCode))
            req.user = decoded;
            return next();
        });
    } catch (error) { next(error) }
};

// Handle Token Refresh
const handleTokenRefresh = async (req, res, next) => {
    try {
        // Get the refresh token from the cookies
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) return next(new CustomError("Something went wrong, Login again!", 440));

        // Find the user with the refresh token
        const foundUser = await User.findOne({ refresh_token: refreshToken });
        if (!foundUser) return next(new CustomError("Something went wrong, Login again!", 440));

        // Verify the refresh token
        jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                res.clearCookie("access_token");
                res.clearCookie("refresh_token");
                return next(new CustomError("Session expired, please log in again", 440));
            }

            // Generate new access token
            const newAccessToken = generateJWTToken(foundUser, 'access', '1h');
            const isProduction = NODE_ENV === "production";
            res.cookie("access_token", newAccessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "None" : "Lax",
                path: "/"
            });

            req.user = decoded;
            next();
        });
    } catch (error) {
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");
        next(error);
    }
};

export default isAuth