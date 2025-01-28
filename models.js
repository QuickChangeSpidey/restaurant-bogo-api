const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // For authentication
    role: { type: String, enum: ['Admin', 'Restaurant', 'Customer'], required: true },
    isActive: { type: Boolean, default: true }, // Track active status
    details: { type: mongoose.Schema.Types.Mixed },
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
    geolocation: { // For geospatial queries
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    menu: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    ads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ad' }],
    coupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],
}, { timestamps: true });
LocationSchema.index({ geolocation: '2dsphere' }); // Geospatial index

const Location = mongoose.model('Location', LocationSchema);

// Menu Item Schema
const MenuItemSchema = new mongoose.Schema({
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
    isAvailable: { type: Boolean, default: true }, // Tracks availability
}, { timestamps: true });

const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

// Coupon Schema Update
const CouponSchema = new mongoose.Schema({
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    type: {
        type: String,
        enum: [
            'BOGO',
            'FreeItem',
            'Discount',
            'SpendMoreSaveMore',
            'FlatDiscount',
            'ComboDeal',
            'FamilyPack',
            'LimitedTime',
            'HappyHour'
        ],
        required: true,
    },
    code: { type: String, unique: true, required: true }, // Unique coupon code
    discountValue: { type: Number }, // Discount value or percentage (optional based on type)
    freeItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }, // For FreeItem type
    comboItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }], // For Combo or FamilyPack
    minimumSpend: { type: Number }, // For SpendMoreSaveMore or FlatDiscount
    maxRedeemValue: { type: Number }, // Optional cap for FlatDiscount
    portionSize: { type: String }, // For FamilyPack
    startTime: { type: Date }, // For HappyHour or LimitedTime
    endTime: { type: Date },
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
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date }, // Optional scheduling
}, { timestamps: true });

const Ad = mongoose.model('Ad', AdSchema);

// Notification Schema
const NotificationSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['Push', 'Email', 'SMS'], required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['Sent', 'Failed', 'Pending'], default: 'Pending' },
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
