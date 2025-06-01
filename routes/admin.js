import express from 'express';
import bookingController from '../controller/booking.js';
import isAuth from '../middleware/isAuthenticated.js';
import tableController from '../controller/table.js';
import authController from '../controller/auth.js';

const router = express.Router();

// Table Routes
router.route('/table/:tableId?/:tableDocID?').get(isAuth, tableController.getAllTables).post(isAuth, tableController.postCreateTable).put(isAuth, tableController.putTableDetails).delete(isAuth, tableController.deleteTable);
router.route('/menu').get(bookingController.getMenuList)
router.route('/booking').post(bookingController.postNewBooking)
router.route('/order/:orderId?').get(isAuth, bookingController.getAllOrders).put(isAuth, bookingController.putOrderStatus)
router.route('/dashboard').get(isAuth, authController.getDashboardAnalytics)

export default router;