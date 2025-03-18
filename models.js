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

  isPolicyAccepted: { type: Boolean, default: false },

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
  genre: [{
    type: String,
    enum: [
      'Italian', 'Chinese', 'Indian', 'American', 'Mexican', 'French', 'Japanese',
      'Mediterranean', 'Vegetarian', 'Vegan', 'Fast Food', 'Seafood', 'Thai', 'Spanish',
      'Korean', 'Greek', 'Turkish', 'Middle Eastern', 'Brazilian', 'Caribbean', 'African',
      'Soul Food', 'Barbecue', 'Fusion', 'European', 'Cajun/Creole', 'Steakhouse', 'Diner',
      'Pasta', 'Sushi', 'Burgers', 'Pizzeria', 'Ice Cream', 'Donuts', 'Dessert', 'Bakery',
      'Food Truck', 'Farm-to-Table', 'Buffet', 'Brunch', 'Hot Pot', 'Dim Sum', 'Tapas', 'Bistro',
      'Fondue', 'Raw Food', 'Juice Bar/Smoothies', 'Poke Bowl', 'Ramen', 'Café', 'Tea House',
      'Wine Bar', 'Coffeehouse', 'Organic', 'Gluten-Free', 'Kosher', 'Halal', 'Low-Carb/Keto',
      'Paleo', 'Health Food', 'Breakfast', 'Brasserie', 'Noodle Bar', 'Grill', 'Taproom',
      'Pizza', 'Sweets', 'Asian Fusion', 'Modern European', 'Contemporary', 'Hawaiian',
      'Latino', 'Poutine', 'Sandwiches', 'Wraps'
    ]
  }],
}, { timestamps: true });

LocationSchema.index({ geolocation: '2dsphere' });

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
// models/Coupon.js

const CouponSchema = new mongoose.Schema(
  {
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    type: {
      type: String,
      enum: [
        'BOGO',                  // 1. Buy 1 Get 1
        'Buy1Get1FreeItem',      // 2. Buy 1 Get 1 Free (Specific Item)
        'StorewideFlatDiscount', // 3. Storewide Flat Discount
        'DiscountOnSpecificItems',//4. Discount on Specific Items
        'SpendMoreSaveMore',     // 5. Spend More Save More
        'FreeItemWithPurchase',  // 6. Free Item with Purchase
        'HappyHour',             // 7. Happy Hour Menu
        'ComboDeal',             // 8. Combo Deals
        'FamilyPack',            // 9. Family Packs
        'LimitedTime'            // 10. Limited Time Offer
      ],
      required: true
    },
    code: {
      type: String,
      unique: true,
      required: true
    },
    // Example discount fields:
    discountPercentage: {
      type: Number, // e.g. for "StorewideFlatDiscount", "DiscountOnSpecificItems", "HappyHour"
      default: 0
    },
    discountValue: {
      type: Number, // e.g. a flat $ off or $ cap
      default: 0
    },

    description: { type: String, default: '', required: function () { return this.type === 'LimitedTime'; } },

    // For combos, BOGO, or specific items:
    purchasedItemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    freeItemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    familyPackItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    familyPackPrice: { type: Number, default: 0 },
    
    // For "Spend More Save More" or "Free Item with Purchase":
    minimumSpend: { type: Number, default: 0 },
    // For "Spend More Save More", you may store tiers:
    spendThresholds: [
      {
        threshold: Number,    // e.g. $50
        discountValue: Number // e.g. $5 discount or 10% discount
      }
    ],

    // For "Happy Hour"
    startHour: { type: Number }, // e.g. 14 = 2 PM
    endHour: { type: Number },   // e.g. 17 = 5 PM

    // For "ComboDeal", "FamilyPack"
    comboItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    comboPrice: { type: Number, default: 0 },
    portionSize: { type: String }, // e.g. "serves 4 people"

    // Duration of the deal
    startTime: { type: Date },
    endTime: { type: Date },
    expirationDate: { type: Date, required: true },

    // Basic usage or redemption constraints
    isActive: { type: Boolean, default: true },
    quantity: { type: Number, default: 0 },        // total redemptions available
    maxUsagePerUser: { type: Number, default: 1 }, // how many times a single user can redeem

    image: { type: String }, // Optional image URL

    // Timestamps
  },
  { timestamps: true }
);

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
