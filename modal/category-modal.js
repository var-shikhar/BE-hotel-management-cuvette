/*
|---------------------------------------------------------------------------
| Category Schema
|---------------------------------------------------------------------------
| Defines the schema for storing menu categories.
| Each category can be used to group menu items (e.g., Pizza, Drink).
*/

import mongoose from 'mongoose';
import Menu from './menu-modal.js';

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: { type: String, required: true },
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
categorySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const category = this;
    try {
        // Find or create a default category
        let defaultCategory = await Category.findOne({ name: 'Uncategorized' });
        if (!defaultCategory) {
            defaultCategory = await Category.create({ name: 'Uncategorized', icon: 'https://picsum.photos/200.webp' });
        }

        // Reassign menu items to default category
        await Menu.updateMany(
            { categoryId: category._id },
            { $set: { categoryId: defaultCategory._id } }
        );

        next();
    } catch (error) {
        next(error);
    }
});

export default Category;
