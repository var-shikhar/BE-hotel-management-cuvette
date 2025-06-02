import express from 'express';
import chefController from '../controller/chef.js';
import bookingController from '../controller/booking.js';
import tableController from '../controller/table.js';

const router = express.Router();

// Table Routes
router.route('/table/:tableId?/:tableDocID?').get(tableController.getAllTables).post(tableController.postCreateTable).put(tableController.putTableDetails).delete(tableController.deleteTable);
router.route('/menu').get(bookingController.getMenuList)
router.route('/booking').post(bookingController.postNewBooking)
router.route('/order/:orderId?').get(bookingController.getAllOrders).put(bookingController.putOrderStatus)
router.route('/dashboard').get(chefController.getDashboardAnalytics)

router.route('/chef/:chefID?').get(chefController.getChefList).post(chefController.postChef).delete(chefController.deleteChef);

export default router;