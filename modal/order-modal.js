/*
|---------------------------------------------------------------------------
| Order Schema
|---------------------------------------------------------------------------
| Defines the schema for customer orders.
| Each order includes customer info, ordered items, order type, location,
| preparation time, and cost breakdown.
*/

import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    clientID: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    orderNumber: { type: Number, unique: true, sparse: true },
    // List of ordered items with their pricing and instructions.
    items: [{
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        tax: { type: Number, default: 0 },
    }],
    totalPrice: { type: Number, default: 0 },
    deliveryCharges: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },

    // Location of the customer (used for delivery).  Type of order: Dine-in or Take-Away.
    location: { type: String, default: '' },
    instructions: { type: String, default: '' },
    orderType: { type: String, enum: ['Dine-in', 'Take-Away'], required: true },
    totalPreparationTime: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Ready', 'Completed', 'Cancelled'],
        default: 'Pending',
    },

    // Backend Detils
    chefID: { type: mongoose.Schema.Types.ObjectId, ref: 'Chef', required: true },
    tableID: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    tableDataID: { type: mongoose.Schema.Types.ObjectId, required: true },
    assignedAt: { type: Date, default: null },
    remainingTime: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
}, { timestamps: true }); // createdAt = order time, updatedAt = last status change

const Order = mongoose.model('Order', orderSchema);
export default Order;
