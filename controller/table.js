/*
|------------------------------------------------------------------------------
| Table Management Controllers
|------------------------------------------------------------------------------
|
| This file defines controllers for managing daily table records in the system.
| It includes functionality for creating, updating, retrieving, and deleting 
| table entries, while ensuring table numbers remain unique and sequential.
|
| Available Controllers:
|
| - `handleCurrentTable`: Initializes today's table document with default data (10 tables).
| - `getAllTables`: Retrieves today's tables, creates them if they don't exist.
| - `postCreateTable`: Adds a new table to today's document after checking for conflicts.
| - `putTableDetails`: Updates table details such as name, number, and chair count.
| - `deleteTable`: Deletes a specific table entry and reorders remaining table numbers.
|
| All controllers include input validation and error handling using `CustomError`,
| and respond using appropriate HTTP status codes via `RouteCode`.
|
*/


import { CustomError } from "../middleware/errorMiddleware.js";
import Order from "../modal/order-modal.js";
import Table from "../modal/table-modal.js";
import RouteCode from "../util/httpStatus.js";

async function handleCurrentTable() {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const tableData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({
            tableName: `Table`,
            tableNo: i,
            totalChairs: 5,
            isAvailable: true,
        }))

        const newTable = new Table({
            date: startOfDay,
            tableData: tableData
        })
        await newTable.save()

        return newTable._id;
    } catch (error) {
        console.log(error)
        throw new Error('Failed to create new table');
    }
}
const getAllTables = async (req, res, next) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    try {
        let foundTable = await Table.findOne({ date: { $gte: startOfDay, $lte: endOfDay } });

        if (!foundTable) {
            const newTableID = await handleCurrentTable();
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

        const finalData = {
            tableID: foundTable._id,
            tableData: tables
        };

        return res.status(RouteCode.SUCCESS.statusCode).json(finalData);
    } catch (error) {
        next(error);
    }
};
const postCreateTable = async (req, res, next) => {
    const { tableName, tableNo, totalChairs } = req.body;
    if (!tableNo || !totalChairs) return next(new CustomError('All fields are required', RouteCode.BAD_REQUEST.statusCode))

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    try {
        let todaysTableDoc = await Table.findOne({ date: { $gte: startOfDay, $lte: endOfDay } });
        if (!todaysTableDoc) {
            const newTableID = await handleCurrentTable();
            todaysTableDoc = await Table.findById(newTableID);
        }

        const isTableNoUsed = todaysTableDoc.tableData.some(table => table.tableNo.toString() === tableNo.toString());
        if (isTableNoUsed) return next(new CustomError('Table number already in use', RouteCode.CONFLICT.statusCode));

        todaysTableDoc.tableData.push({
            tableName: tableName ?? 'Table',
            tableNo,
            totalChairs,
            isAvailable: true,
        })

        todaysTableDoc.tableData = todaysTableDoc.tableData.sort((a, b) => a.tableNo - b.tableNo);
        await todaysTableDoc.save();
        res.status(RouteCode.SUCCESS.statusCode).json({ message: "Table created successfully" });
    } catch (error) {
        next(error);
    }
};
const putTableDetails = async (req, res, next) => {
    const { tableID, tableDataID, tableName, tableNo, totalChairs } = req.body;
    if (!tableNo || !totalChairs) return next(new CustomError('All fields are required', RouteCode.BAD_REQUEST.statusCode))
    try {
        let foundTable = await Table.findById(tableID);
        if (!foundTable) return next(new CustomError('Table not found', RouteCode.NOT_FOUND.statusCode))

        const targetTable = foundTable.tableData.find(table => table._id.toString() === tableDataID);
        if (!targetTable) return next(new CustomError('Table data not found', RouteCode.NOT_FOUND.statusCode))

        if (targetTable.tableNo !== tableNo) {
            const isTableNoUsed = foundTable.tableData.some(table => table.tableNo.toString() === tableNo.toString());
            if (isTableNoUsed) return next(new CustomError('Table number already in use', RouteCode.CONFLICT.statusCode));
        }

        targetTable.tableName = tableName ?? 'Table';
        targetTable.tableNo = tableNo;
        targetTable.totalChairs = totalChairs;

        // Reorder the Table Data
        foundTable.tableData = foundTable.tableData.sort((a, b) => a.tableNo - b.tableNo)
        await foundTable.save();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: "Table updated successfully" });
    } catch (error) {
        next(error);
    }
};
const deleteTable = async (req, res, next) => {
    const { tableId, tableDocID } = req.params;
    if (!tableId || !tableDocID) return next(new CustomError('Table ID is required', RouteCode.BAD_REQUEST.statusCode))
    try {
        const foundTable = await Table.findById(tableId);
        if (!foundTable) return next(new CustomError('Table not found', RouteCode.NOT_FOUND.statusCode))

        // Check if the table to delete exists
        const tableExists = foundTable.tableData.some(table => table._id.toString() === tableDocID);
        if (!tableExists) return next(new CustomError('Table entry not found in tableData', RouteCode.NOT_FOUND.statusCode));

        // Remove the specific table entry
        foundTable.tableData = foundTable.tableData.filter(table => table._id.toString() !== tableDocID);

        // Reassign tableNo in order (starting from 1)
        foundTable.tableData = foundTable.tableData.map((table, index) => ({
            ...table.toObject(),
            tableNo: index + 1
        }));


        await foundTable.save();
        await Order.deleteMany({ tableDataID: tableDocID });
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: "Table deleted successfully" });
    } catch (error) {
        next(error);
    }
};


export default {
    getAllTables,
    postCreateTable,
    putTableDetails,
    deleteTable,
    handleCurrentTable
}