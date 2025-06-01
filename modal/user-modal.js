/*
|---------------------------------------------------------------------------
| User Schema
|---------------------------------------------------------------------------
| Defines schema for storing user details: name, email, role, and password.
*/

import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    contact: { type: String, trim: true },
    password: {
        type: String,
        required: true,
    },
    refresh_token: { type: String },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;