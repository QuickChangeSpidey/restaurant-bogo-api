const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['Admin', 'Restaurant', 'Customer'], required: true },
    details: { type: mongoose.Schema.Types.Mixed }, // Flexible details for different user types
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// Location Schema
const LocationSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    logo: { type: String },
    address: { type: String, required: true },
    hours: { type: String },
    qrCode: { type: String },
    menu: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    ads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ad' }],
    coupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],
}, { timestamps: true });

const Location = mongoose.model('Location', LocationSchema);

// Menu Item Schema
const MenuItemSchema = new mongoose.Schema({
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
}, { timestamps: true });

const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

// Coupon Schema
const CouponSchema = new mongoose.Schema({
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    type: { type: String, enum: ['Discount', 'FreeItem', 'BOGO', 'Cashback'], required: true },
    number: { type: Number, required: true },
    generationDate: { type: Date, default: Date.now },
    expirationDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', CouponSchema);

// Ad Schema
const AdSchema = new mongoose.Schema({
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    type: { type: String, enum: ['Video', 'Image'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Ad = mongoose.model('Ad', AdSchema);

// Notification Schema
const NotificationSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['Push', 'Email', 'SMS'], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);

// Export all models
module.exports = {
    User,
    Location,
    MenuItem,
    Coupon,
    Ad,
    Notification,
};
