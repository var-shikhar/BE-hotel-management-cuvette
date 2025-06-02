/*
|--------------------------------------------------------------------------
| Chef Management and Dashboard Analytics Controllers
|--------------------------------------------------------------------------
|
| This file includes controllers for managing chefs and retrieving dashboard analytics.
| These controllers handle CRUD operations for chefs and aggregate data for dashboard insights.
|
| Available Controllers:
|
| - `getChefList`: Retrieves all chefs and their corresponding order counts.
| - `postChef`: Adds a new chef with the specified name after validating uniqueness.
| - `deleteChef`: Deletes a chef by ID, ensuring admin chefs cannot be removed.
| - `getDashboardAnalytics`: Compiles analytics such as total chefs, clients, orders,
|   revenue, and table availability for the current day.
|
| All controllers perform validation and use the `CustomError` class for error handling.
| Standard HTTP status codes are returned via `RouteCode`.
|
*/


import { CustomError } from "../middleware/errorMiddleware.js";
import Chef from "../modal/chef-modal.js";
import Client from "../modal/client-modal.js";
import Order from "../modal/order-modal.js";
import Table from "../modal/table-modal.js";
import RouteCode from "../util/httpStatus.js";
import TBController from './table.js';


// Get Chef List
const getChefList = async (req, res, next) => {
    try {
        const foundChefs = await Chef.find();
        const foundOrders = await Order.find().populate('chefID');

        const finalData = foundOrders?.reduce((acc, cur) => {
            if (!acc[cur.chefID.chefName]) acc[cur.chefID.chefName] = 0;
            acc[cur.chefID.chefName] += 1;
            return acc;
        }, {});

        const finalList = foundChefs?.map(chef => ({
            chefId: chef._id,
            chefName: chef.chefName ?? 'N/A',
            isAdmin: chef.isAdmin,
            totalOrders: finalData[chef.chefName] ?? 0,
        })) ?? [];

        return res.status(RouteCode.SUCCESS.statusCode).json(finalList);
    } catch (error) {
        next(error);
    }
}
// Create New Chef
const postChef = async (req, res, next) => {
    const { name } = req.body;
    if (!name) return next(new CustomError("Invalid details shared!", RouteCode.BAD_REQUEST.statusCode))
    try {
        const foundChef = await Chef.findOne({ name });
        if (foundChef) return next(new CustomError("Chef already exists with this name!", RouteCode.CONFLICT.statusCode));

        const newChef = new Chef({ chefName: name, isAdmin: false });
        await newChef.save();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Chef created successfully' });
    } catch (err) {
        next(err)
    }
}
// Delete Chef
const deleteChef = async (req, res, next) => {
    const { chefID } = req.params;
    if (!chefID) return next(new CustomError("Something went wrong, Try again!", RouteCode.CONFLICT.statusCode));
    try {
        const foundChef = await Chef.findById(chefID);
        if (!foundChef) return next(new CustomError("Chef not found!", RouteCode.NOT_FOUND.statusCode));
        if (foundChef.isAdmin) return next(new CustomError("Admin chefs cannot be deleted!", RouteCode.CONFLICT.statusCode));

        await foundChef.deleteOne();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Chef has deleted successfully!' });
    } catch (error) {
        next(error);
    }
}

// Get Analytics
const getDashboardAnalytics = async (req, res, next) => {
    try {
        const now = new Date();

        // Define date ranges
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const startOfLast7Days = new Date(now);
        startOfLast7Days.setDate(now.getDate() - 6);
        startOfLast7Days.setHours(0, 0, 0, 0);

        const startOfLast4Weeks = new Date(now);
        startOfLast4Weeks.setDate(now.getDate() - 27);
        startOfLast4Weeks.setHours(0, 0, 0, 0);

        // Fetch basic counts and revenue aggregation concurrently
        const [totalChef, totalOrder, totalClient, chefList, tableToday] = await Promise.all([
            Chef.countDocuments(),
            Order.countDocuments(),
            Client.countDocuments(),
            Chef.aggregate([
                {
                    $lookup: {
                        from: "orders",
                        localField: "_id",
                        foreignField: "chefID",
                        as: "orders"
                    }
                },
                {
                    $addFields: {
                        totalOrders: { $size: "$orders" }
                    }
                },
                {
                    $project: {
                        chefId: "$_id",
                        chefName: { $ifNull: ["$chefName", "N/A"] },
                        isAdmin: 1,
                        totalOrders: 1
                    }
                }
            ]),
            Table.findOne({ date: { $gte: startOfDay, $lte: endOfDay } }),
        ]);

        // 📅 Time-Based Donut Chart Data (Filtered by completed orders only)
        const [dailyOrders, weeklyOrders, monthlyOrders, yearlyOrders, last4WeeksOrders] = await Promise.all([
            Order.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
            Order.find({ createdAt: { $gte: startOfLast7Days, $lte: endOfDay } }),
            Order.find({ createdAt: { $gte: startOfMonth, $lte: endOfDay } }),
            Order.find({ createdAt: { $gte: startOfYear, $lte: endOfDay } }),
            Order.find({ createdAt: { $gte: startOfLast4Weeks, $lte: endOfDay } }),
        ]);

        const reduceOrdersSummary = (orders) =>
            orders.reduce(
                (acc, order) => {
                    if (order.status === "Completed") acc["Completed"] += 1;
                    if (!acc[order.orderType]) acc[order.orderType] = 0;
                    acc[order.orderType] += 1;
                    return acc;
                },
                { ["Take-Away"]: 0, ["Dine-in"]: 0, ["Completed"]: 0 }
            );

        const dailySummary = reduceOrdersSummary(dailyOrders);
        const weeklySummary = reduceOrdersSummary(weeklyOrders);
        const monthlySummary = reduceOrdersSummary(monthlyOrders);
        const yearlySummary = reduceOrdersSummary(yearlyOrders);

        // Calculate total revenue from all orders
        const allOrders = await Order.find({});
        const totalRevenue = allOrders.reduce((sum, order) => sum + order.grandTotal, 0);

        // Helper: format date weekday short (Mon, Tue, etc.)
        const getWeekday = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });

        // Helper: get last 7 days in order (Mon, Tue, ...)
        const getLast7Days = () => {
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                days.push(getWeekday(d));
            }
            return days;
        };

        // Initialize last7Days revenue with 0 for all last 7 days (Mon, Tue, ...)
        const revenueLast7Days = {};
        getLast7Days().forEach(day => {
            revenueLast7Days[day] = 0;
        });

        // Sum orders revenue for last 7 days
        weeklyOrders.forEach(order => {
            const day = getWeekday(new Date(order.createdAt));
            revenueLast7Days[day] += order.grandTotal;
        });

        // Initialize last 4 weeks revenue with 0
        const revenueLast4Weeks = {};
        for (let i = 1; i <= 4; i++) revenueLast4Weeks[`Week ${i}`] = 0;

        last4WeeksOrders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const diffDays = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
            const weekNumber = Math.floor(diffDays / 7) + 1; // Week 1 is most recent
            if (weekNumber <= 4) {
                revenueLast4Weeks[`Week ${weekNumber}`] += order.grandTotal;
            }
        });

        // Prepare table data for response
        const tables = (tableToday?.tableData || []).map(table => ({
            tableDataID: table._id,
            tableName: table.tableName,
            tableNo: table.tableNo,
            totalChairs: table.totalChairs,
            isAvailable: table.isAvailable,
        }));

        // Final response
        const finalData = {
            totalChef,
            totalOrder,
            totalClient,
            totalRevenue,
            tableData: tables,
            chefList,
            orderSummary: {
                daily: dailySummary,
                weekly: weeklySummary,
                monthly: monthlySummary,
                yearly: yearlySummary
            },
            revenueSummary: {
                daily: revenueLast7Days,
                weekly: revenueLast4Weeks,
            },
        };

        return res.status(RouteCode.SUCCESS.statusCode).json(finalData);
    } catch (err) {
        console.error("Dashboard analytics error:", err);
        return next(err);
    }
};


export default {
    getChefList,
    postChef, deleteChef, getDashboardAnalytics

};