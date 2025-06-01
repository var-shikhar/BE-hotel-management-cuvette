/*
|---------------------------------------------------------------------------
| Menu Schema
|---------------------------------------------------------------------------
| Defines the schema for individual menu items in the system.
| Each item includes its name, price, description, prep time, and tax rate.
*/

import mongoose from 'mongoose';
import Order from './order-modal.js';

const menuSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    itemPrice: { type: Number, required: true },
    itemImage: { type: String, },
    description: { type: String },
    preparationTime: { type: Number },
    tax: { type: Number, default: 0 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
}, { timestamps: true });

const Menu = mongoose.model('Menu', menuSchema);
menuSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const menuItem = this;
    try {
        await Order.deleteMany({
            'items.itemId': menuItem._id
        });

        next();
    } catch (error) {
        next(error);
    }
});

export default Menu;
