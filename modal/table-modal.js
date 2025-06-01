/*
|---------------------------------------------------------------------------
| Table Schema
|---------------------------------------------------------------------------
| Defines the schema for storing information about tables in a venue.
| Each document represents a snapshot (by date) of all tables and their status.
*/

import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
    date: { type: Date, required: true, default: Date.now },
    tableData: [{
        tableName: { type: String, required: true },
        tableNo: { type: Number, required: true },
        totalChairs: { type: Number, required: true },
        isAvailable: { type: Boolean, default: true },
    }],
}, { timestamps: true });

const Table = mongoose.model('Table', tableSchema);
export default Table;