/*
|---------------------------------------------------------------------------
| Chef Schema
|---------------------------------------------------------------------------
| Defines the schema for chefs: Name, isAdmin.
*/

import mongoose from 'mongoose';
import { CustomError } from '../middleware/errorMiddleware.js';
import RouteCode from '../util/httpStatus.js';
import Order from './order-modal.js';

const chefSchema = new mongoose.Schema({
    chefName: { type: String, required: true, unique: true },
    isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

const Chef = mongoose.model('Chef', chefSchema);
chefSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const chef = this;
    try {
        if (chef.isAdmin) return next(new CustomError('Admin chefs cannot be deleted.', RouteCode.BAD_REQUEST.statusCode));

        // Find an admin chef
        const adminChef = await Chef.findOne({ isAdmin: true });
        if (!adminChef) return next(new CustomError('No admin chef found for reassignment', RouteCode.EXPECTATION_FAILED.statusCode));

        // Reassign orders
        await Order.updateMany(
            { chefId: chef._id },
            { $set: { chefId: adminChef._id } }
        );

        next();
    } catch (error) {
        next(error);
    }
});

export default Chef; 