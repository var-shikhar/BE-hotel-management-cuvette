import { CustomError } from "../middleware/errorMiddleware.js";
import Category from "../modal/category-modal.js";
import Chef from "../modal/chef-modal.js";
import Client from "../modal/client-modal.js";
import Menu from "../modal/menu-modal.js";
import Order from "../modal/order-modal.js";
import Table from "../modal/table-modal.js";
import RouteCode from "../util/httpStatus.js";


// Menu Controller
const getMenuList = async (req, res, next) => {
    try {
        const [categories, menuItems] = await Promise.all([
            Category.find().lean(),
            Menu.find().lean(),
        ]);

        if (categories.length <= 0 || menuItems.length <= 0) return next(new CustomError('No categories or menu items found', RouteCode.NOT_FOUND.statusCode))

        const finalData = {
            category: categories?.reduce((acc, item) => {
                acc.push({ id: item._id, title: item.name, icon: item.icon })
                return acc;
            }, []),
            menu: menuItems?.reduce((acc, item) => {
                acc.push({
                    id: item._id,
                    title: item.itemName,
                    price: item.itemPrice,
                    image: item.itemImage,
                    description: item.description,
                    preparationTime: item.preparationTime,
                    tax: item.tax,
                    categoryId: item.categoryId
                })
                return acc
            }, []),
        }


        return res.status(RouteCode.SUCCESS.statusCode).json(finalData);
    } catch (error) {
        next(error);
    }
};

// Order Controller
const getAllOrders = async (req, res, next) => {
    try {
        await calculateRemainingTime(next)
        const orders = await Order.find()
            .populate('clientID', 'personName personNumber')
            .populate('items.itemId', 'itemName itemPrice')
            .sort({ createdAt: -1 })
            .lean();

        const foundOrders = [];
        for (const item of orders) {
            const tableData = await Table.findOne({
                'tableData._id': item.tableDataID
            });

            const assignmentDate = item.assignedAt instanceof Date
                ? item.assignedAt
                : new Date(item.assignedAt);

            foundOrders.push({
                orderID: item._id,
                orderNumber: item.orderNumber,
                clientName: item.clientID?.personName || '',
                clientPhone: item.clientID?.personNumber || '',
                tableName: tableData?.tableData?.find(t => t._id.equals(item.tableDataID))?.tableName || '',
                tableNo: tableData?.tableData?.find(t => t._id.equals(item.tableDataID))?.tableNo || 0,
                assignedTime: assignmentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }),
                remainingTime: item.remainingTime,
                orderType: item.orderType,
                status: item.status,
                pickupStatus: item.pickupStatus ?? null,
                items: item.items.map(i => ({
                    itemName: i.itemId?.itemName || '',
                    itemQuantity: i.quantity,
                    itemInstructions: i.instructions,
                })),
            });
        }

        return res.status(RouteCode.SUCCESS.statusCode).json(foundOrders);
    } catch (error) {
        next(error);
    }
};
const postNewBooking = async (req, res, next) => {
    const { clientName, clientPhone, itemJSON, deliveryCharges, total, location, orderType, cookingInstructions } = req.body;
    if (!clientName || !clientPhone || !total || !orderType) return next(new CustomError('Please fill all the fields', RouteCode.BAD_REQUEST.statusCode))
    if (orderType === 'Take-Away' && location.trim() === '') return next(new CustomError('Please enter a valid location', RouteCode.BAD_REQUEST.statusCode))

    const items = typeof itemJSON === 'string' ? JSON.parse(itemJSON) : itemJSON;
    if (Array.isArray(items) && items.length <= 0) return next(new CustomError('Please add atleast one item', RouteCode.BAD_REQUEST.statusCode))

    try {
        let foundUser = await Client.findOne({ personNumber: clientPhone });
        if (!foundUser) {
            foundUser = new Client({
                personName: clientName,
                personNumber: clientPhone,
            });
            await foundUser.save();
        }

        // Step 1: Fetch preparation times from Menu items
        const menuItems = await Menu.find({
            _id: { $in: items.map(i => i.itemId) }
        }).select('_id preparationTime');

        const prepTimeMap = new Map();
        menuItems.forEach(item => prepTimeMap.set(item._id.toString(), item.preparationTime || 0));

        // Step 2: Calculate total preparation time
        let totalPreparationTime = 0;
        items.forEach(i => {
            const prepTime = prepTimeMap.get(i.itemId.toString()) || 0;
            totalPreparationTime += prepTime * i.quantity;
        });

        // Book Table
        const { success, message, tableID, bookedTable } = await bookTable(next);
        const { chefID, status, assignedAt } = await findAvailableChef(next);


        // Step 3: Calculate time fields
        const assignedAtDate = assignedAt instanceof Date ? assignedAt : new Date(assignedAt);
        const completedAt = new Date(assignedAtDate.getTime() + totalPreparationTime * 60 * 1000);
        const remainingTime = Math.max(completedAt - new Date(), 0);
        const subTotal = items?.reduce((acc, i) => {
            acc += (i.price * i.quantity) + i.tax
            return acc;
        }, 0);

        // Step 4: Create order
        const newOrder = new Order({
            clientID: foundUser._id,
            orderNumber: await generateOrderNumber(),
            items: items?.map(i => ({
                itemId: i.itemId,
                price: i.price,
                quantity: i.quantity,
                tax: i.tax,
            })),
            totalPrice: subTotal,
            deliveryCharges: deliveryCharges ?? 0,
            grandTotal: subTotal + (orderType === 'Take-Away' ? deliveryCharges : 0),
            location: location ?? null,
            orderType: orderType,
            totalPreparationTime,
            instructions: cookingInstructions,
            completedAt,
            remainingTime,
            status,
            tableID: tableID,
            tableDataID: bookedTable,
            chefID: chefID,
            assignedAt: assignedAtDate
        });

        await newOrder.save();
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Order placed successfully' });
    } catch (error) {
        next(error)
    }
}
const putOrderStatus = async (req, res, next) => {
    const { orderId } = req.params;
    if (!orderId) return next(new CustomError('Order ID is required', RouteCode.BAD_REQUEST.statusCode));
    try {
        const foundOrder = await Order.findById(orderId);
        if (!foundOrder) return next(new CustomError('Order not found', RouteCode.NOT_FOUND.statusCode));

        foundOrder.status = 'Completed';
        await foundOrder.save();

        await calculateRemainingTime(next)
        return res.status(RouteCode.SUCCESS.statusCode).json({ message: 'Order has completed successfully!' });
    } catch (error) {
        next(error);
    }
};
async function generateOrderNumber() {
    const lastOrder = await Order.findOne().sort({ orderNumber: -1 }).select('orderNumber');
    return lastOrder ? lastOrder.orderNumber + 1 : 100;
};
async function bookTable(next) {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todaysTableDoc = await Table.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!todaysTableDoc) return next(new CustomError('No tables found! Contact Manager to create tables!', RouteCode.CONFLICT.statusCode));
        const emptyTableIdx = todaysTableDoc.tableData.findIndex(t => t.isAvailable);
        if (emptyTableIdx === -1) return next(new CustomError('No empty tables found! Contact Manager to create tables!', RouteCode.CONFLICT.statusCode));

        // Mark table as booked
        todaysTableDoc.tableData[emptyTableIdx].isAvailable = false;
        await todaysTableDoc.save();

        return {
            success: true,
            message: 'Table booked successfully.',
            tableID: todaysTableDoc._id,
            bookedTable: todaysTableDoc.tableData[emptyTableIdx]._id
        };
    } catch (error) {
        // Rethrow the error to be handled by the calling context (e.g., controller or middleware)
        throw error;
    }
}
async function findAvailableChef(next) {
    try {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const allChefs = await Chef.find();
        const activeOrders = await Order.find({
            status: { $in: ['Pending', 'In Progress'] },
            chefID: { $ne: null }
        }).select('chefID completedAt totalPreparationTime assignedAt');

        // Step 1: Identify busy chefs (already assigned to a pending/in-progress order)
        const busyChefIds = new Set(activeOrders.map(order => order.chefID.toString()));

        // Step 2: Find chefs that are not currently assigned
        const availableChefs = allChefs.filter(chef => !busyChefIds.has(chef._id.toString()));
        if (availableChefs.length > 0) {
            // Step 3: Among available chefs, pick one with fewest orders today
            const chefOrderCounts = await Promise.all(
                availableChefs.map(async chef => {
                    const count = await Order.countDocuments({
                        chefID: chef._id,
                        createdAt: {
                            $gte: startOfDay,
                            $lte: endOfDay
                        }
                    });
                    return { chefId: chef._id, assignmentDate: now, orderCount: count };
                })
            );

            // Pick chef with fewest orders
            chefOrderCounts.sort((a, b) => a.orderCount - b.orderCount);
            return { chefID: chefOrderCounts[0].chefId, status: 'In Progress', assignedAt: now };
        }

        // Step 4: All chefs are busy → pick the one finishing soonest
        const chefCompletionMap = new Map(); // chefID -> maxEstimatedCompletion
        for (const order of activeOrders) {
            let estimatedCompletion = order.completedAt;
            if (!estimatedCompletion && order.assignedAt) {
                estimatedCompletion = new Date(order.assignedAt);
                estimatedCompletion.setMinutes(estimatedCompletion.getMinutes() + order.totalPreparationTime);
            }

            if (!estimatedCompletion) continue;

            const chefId = order.chefID.toString();
            const existingTime = chefCompletionMap.get(chefId);

            if (!existingTime || estimatedCompletion > existingTime) {
                chefCompletionMap.set(chefId, estimatedCompletion);
            }
        }

        // Find chef with the soonest *latest* order completion
        let soonestChef = null;
        let newAssignmentTime = now;
        let minRemainingTime = Infinity;

        for (const [chefId, completionTime] of chefCompletionMap.entries()) {
            const remainingTime = completionTime - now;
            if (remainingTime < minRemainingTime) {
                minRemainingTime = remainingTime;
                soonestChef = chefId;
                newAssignmentTime = completionTime;
            }
        }

        if (soonestChef) return { chefID: soonestChef, status: 'Pending', assignedAt: newAssignmentTime || now };


        // No chef available
        return next(new CustomError('No available chefs found. Please try again later.', RouteCode.CONFLICT.statusCode));
    } catch (error) {
        next(error);
    }
}
async function calculateRemainingTime(next) {
    try {
        const now = new Date();
        const foundOrders = await Order.find({
            status: { $in: ['Pending', 'In Progress'] },
            completedAt: { $ne: null }
        });

        if (foundOrders.length > 0) {
            await Promise.all(
                foundOrders.map(async (order) => {
                    const completedAt = new Date(order.completedAt);
                    const remainingTime = Math.max(completedAt - now, 0);
                    order.remainingTime = remainingTime;

                    // Auto-progress if assignedAt has passed and status is still Pending
                    if (order.status === 'Pending' && order.assignedAt && order.assignedAt <= now) {
                        order.status = 'In Progress';
                    }

                    // Mark as Completed and free the table if time is over
                    if (remainingTime <= 0 && order.status !== 'Completed') {
                        order.status = 'Completed';

                        // Mark table as available again
                        if (order.tableID) {
                            const tableDoc = await Table.findById(order.tableID);
                            if (tableDoc) {
                                const targetTable = tableDoc.tableData.find(t => t._id.equals(order.tableDataID));
                                if (targetTable) {
                                    targetTable.isAvailable = true;
                                    await tableDoc.save();
                                }
                            }
                        }
                    }

                    await order.save();
                })
            );
        }
    } catch (error) {
        next(error);
    }
}


export default {
    getMenuList,
    getAllOrders,
    postNewBooking,
    putOrderStatus,
    calculateRemainingTime
}

