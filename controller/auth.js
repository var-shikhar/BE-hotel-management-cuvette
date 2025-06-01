/*
|--------------------------------------------------------------------------
| User Authentication and Management Controllers
|--------------------------------------------------------------------------
|
| This file contains controllers for handling user authentication, profile management,
| and user actions like login, registration, and updates. The controllers include:
|
| - `postLogin`: Authenticates the user, validates credentials, and issues JWT tokens.
| - `postRegister`: Handles user registration with validation and password hashing.
| - `getLogout`: Logs out the user by clearing authentication cookies and refresh token.
| - `getMemberList`: Retrieves a list of all users in the system.
| - `getMemberDetail`: Fetches details of a specific user.
| - `postMember`: Creates a new user and assigns them a role based on existing Admin.
| - `putMemberDetail`: Updates user profile information and changes the password if necessary.
| - `deleteMember`: Deletes a user, with checks to ensure only authorized actions.
|
| All controllers validate input and handle errors with the `CustomError` class.
| Responses include status codes based on the result of the operation, using `RouteCode`.
| 
| Authentication is done via JWT tokens, and bcrypt is used for hashing passwords securely.
|
*/

import { configDotenv } from "dotenv";
import { CustomError } from "../middleware/errorMiddleware.js";
import Chef from "../modal/chef-modal.js";
import Client from "../modal/client-modal.js";
import Order from "../modal/order-modal.js";
import Table from "../modal/table-modal.js";
import RouteCode from "../util/httpStatus.js";
import TBController from './table.js'

configDotenv();

const { NODE_ENV } = process.env;

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
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    try {
        const [totalChef, totalOrder, orderData, totalClient, chefList] = await Promise.all([
            Chef.countDocuments(),
            Order.countDocuments(),
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$grandTotal" }
                    }
                }
            ]),
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
        ]);

        let foundTable = await Table.findOne({ date: { $gte: startOfDay, $lte: endOfDay } });

        if (!foundTable) {
            const newTableID = await TBController.handleCurrentTable();
            if (!newTableID) return next(new CustomError('Unable to initialize table for today', RouteCode.EXPECTATION_FAILED.statusCode));

            foundTable = await Table.findById(newTableID);
            if (!foundTable) return next(new CustomError('Table document creation failed', RouteCode.EXPECTATION_FAILED.statusCode));
        }


        const tables = (foundTable.tableData || []).map(table => ({
            tableDataID: table._id,
            tableName: table.tableName,
            tableNo: table.tableNo,
            totalChairs: table.totalChairs,
            isAvailable: table.isAvailable
        }));

        const totalRevenue = orderData[0]?.totalRevenue ?? 0;
        const finalData = {
            totalChef,
            totalRevenue,
            totalOrder,
            totalClient,
            tableData: tables,
            chefList,
        };

        return res.status(RouteCode.SUCCESS.statusCode).json(finalData);
    } catch (err) {
        next(err);
    }
}

export default {
    getChefList,
    postChef, deleteChef, getDashboardAnalytics

};