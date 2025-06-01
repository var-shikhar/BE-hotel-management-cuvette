/*
|---------------------------------------------------------------------------
| Auth Routes
|---------------------------------------------------------------------------
| Routes for user authentication (login, logout) and user management.
| Protected routes use `isAuth` middleware to verify authentication.
| Includes CRUD operations for members.
*/

import express from "express";
import authController from "../controller/auth.js";
import isAuth from "../middleware/isAuthenticated.js";

const router = express.Router();

router.route('/login').post(authController.postLogin);
router.route('/logout').get(isAuth, authController.getLogout);

// Chef Controller
router.route('/chef/:chefID?').get(isAuth, authController.getChefList).post(isAuth, authController.postChef).delete(isAuth, authController.deleteChef);

export default router;
