const mongoose = require('mongoose');

/**
 * USER SCHEMA
 * 
 * CHANGES:
 * 1) Added `cognitoSub` field (unique) to link a Cognito user to this Mongo document.
 * 2) Made `password` optional if you're relying solely on Cognito for authentication.
 *    (You can remove `password` entirely if you do not need it for any local auth.)
 */
const UserSchema = new mongoose.Schema({
    // The unique identifier from Cognito (sub claim).
    // Allows you to link the Cognito user to this local User doc.
    cognitoSub: { type: String, unique: true, sparse: true },

    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },

    role: { type: String, enum: ['Admin', 'Restaurant', 'Customer'], required: true },
    isActive: { type: Boolean, default: true },
    details: { type: mongoose.Schema.Types.Mixed },

    // For Customer users who favorite specific Locations
    favoritesLocations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

/**
 * LOCATION SCHEMA
 * 
 * Links to a User with role = Restaurant via `restaurantId`.
 */
const LocationSchema = new mongoose.Schema({
    restaurantId: { type: String, ref: 'User', required: true },
    name: { type: String, required: true },
    logo: { type: String },
    address: { type: String, required: true },
    hours: { type: String },
    qrCode: { type: String },
    geolocation: {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    menu: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    ads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ad' }],
    coupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],
}, { timestamps: true });
LocationSchema.index({ geolocation: '2dsphere' }); // Enable geospatial queries

const Location = mongoose.model('Location', LocationSchema);

/**
 * MENU ITEM SCHEMA
 */
const MenuItemSchema = new mongoose.Schema({
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
    isAvailable: { type: Boolean, default: true }, // Tracks availability
}, { timestamps: true });

const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

/**
 * COUPON SCHEMA
 * 
 * CHANGES:
 * 1) Added `quantity` field for total coupon availability.
 * 2) Added `maxUsagePerUser` if you want to limit usage per user.
 */
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
    code: { type: String, unique: true, required: true },
    discountValue: { type: Number },
    freeItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    comboItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    minimumSpend: { type: Number },
    maxRedeemValue: { type: Number },
    portionSize: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
    generationDate: { type: Date, default: Date.now },
    expirationDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },

    // How many total redemptions are available for this coupon
    quantity: { type: Number, default: 0 },

    // Limit how many times a single user can redeem this coupon
    maxUsagePerUser: { type: Number, default: 1 }
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', CouponSchema);

/**
 * COUPON REDEMPTION SCHEMA
 * 
 * Tracks each redemption event for analytics / auditing.
 */
const CouponRedemptionSchema = new mongoose.Schema({
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    redeemedAt: { type: Date, default: Date.now },
});

const CouponRedemption = mongoose.model('CouponRedemption', CouponRedemptionSchema);

/**
 * AD SCHEMA
 */
const AdSchema = new mongoose.Schema({
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    type: { type: String, enum: ['Video', 'Image'], required: true },
    content: { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
}, { timestamps: true });

const Ad = mongoose.model('Ad', AdSchema);

/**
 * NOTIFICATION SCHEMA
 */
const NotificationSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['Push', 'Email', 'SMS'], required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['Sent', 'Failed', 'Pending'], default: 'Pending' },
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);


/**
 * EXPORT ALL MODELS
 */
module.exports = {
    User,
    Location,
    MenuItem,
    Coupon,
    CouponRedemption,
    Ad,
    Notification,
};
