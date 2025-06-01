/*
|---------------------------------------------------------------------------
| Client Schema
|---------------------------------------------------------------------------
| Defines the schema for customer.
*/

import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    personName: { type: String, required: true },
    personNumber: { type: String, required: true },
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);
export default Client;
