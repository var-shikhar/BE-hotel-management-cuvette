/*
|------------------------------------------------------------------------------
| MongoDB Connection & Default Data Initialization
|------------------------------------------------------------------------------
|
| This module establishes a connection to MongoDB using Mongoose and ensures that 
| essential default data (chefs, categories, menu items, and tables) is loaded into 
| the database if it doesn't already exist.
|
| Functionality:
| - Loads environment variables using `dotenv` for secure configuration.
| - Connects to MongoDB using the `MONGO_URI` defined in the `.env` file.
| - Checks for existing records in the `Chef`, `Category`, `Menu`, and `Table` collections.
| - If no records are found:
|     - Inserts default chefs (`CHEF_DATA`)
|     - Inserts default categories (`CATEGORY_DATA`)
|     - Initializes tables using `handleCurrentTable()`
|     - Inserts default menu items (`MENU_ITEMS`), assigning `categoryId` using category names.
| - Emits a `connected` event on successful connection and initialization.
| - Logs an error and exits the process if the connection fails.
|
*/



import { configDotenv } from 'dotenv';
import mongoose from 'mongoose';
import CONSTANT from '../constant/constant.js';
import TABLE from '../controller/table.js';
import Category from '../modal/category-modal.js';
import Chef from '../modal/chef-modal.js';
import Menu from '../modal/menu-modal.js';
import Table from '../modal/table-modal.js';

configDotenv();
const { MONGO_URI, SALT } = process.env;
const { CATEGORY_DATA, CHEF_DATA, MENU_ITEMS } = CONSTANT;

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const chefCount = await Chef.countDocuments();
        const categoryCount = await Category.countDocuments();
        const menuCount = await Menu.countDocuments();
        const tableCount = await Table.countDocuments();

        if (chefCount === 0) await Chef.insertMany(CHEF_DATA);
        if (categoryCount === 0) await Category.insertMany(CATEGORY_DATA);
        if (tableCount === 0) await TABLE.handleCurrentTable()
        if (menuCount === 0 && categoryCount > 0 && chefCount > 0) {
            const foundCategories = await Category.find();

            const menuItemsWithCategoryIds = MENU_ITEMS.map(item => {
                const category = foundCategories.find(cat => cat.name === item.categoryId);
                if (!category) return null; // handle missing category safely
                return { ...item, categoryId: category._id };
            }).filter(item => item !== null); // remove null entries

            await Menu.insertMany(menuItemsWithCategoryIds);
        }

        mongoose.connection.emit('connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

export default connectDB;