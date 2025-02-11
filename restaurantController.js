/**
 * restaurantController.js
 *
 * Demonstrates the recommended approach where you rely on a single Mongoose
 * connection (established in app.js / server.js). No open/close logic here,
 * so queries reuse the existing connection pool.
 */
const { User, Location, MenuItem, Coupon, Ad, Notification, CouponRedemption } = require('./models');
const QRCode = require('qrcode');

// 1) Add a new location
const addLocation = async (req, res, next) => {
  try {
    const location = new Location({
      ...req.body,
      restaurantId: req.user.id,
    });
    const savedLocation = await location.save();
    return res.status(201).json(savedLocation);
  } catch (err) {
    next(err);
  }
};

// 2) Update location
const updateLocation = async (req, res, next) => {
  try {
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    return res.status(200).json(location);
  } catch (err) {
    next(err);
  }
};

// 3) Delete location
const deleteLocation = async (req, res, next) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    return res.status(200).json({ message: 'Location deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// 4) Add menu item
const addMenuItem = async (req, res, next) => {
  try {
    const menuItem = new MenuItem({
      ...req.body,
      locationId: req.body.locationId,
    });
    const savedMenuItem = await menuItem.save();
    return res.status(201).json(savedMenuItem);
  } catch (err) {
    next(err);
  }
};

// 5) Update menu item
const updateMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!menuItem) {
      return res.status(404).json({ error: 'MenuItem not found' });
    }
    return res.status(200).json(menuItem);
  } catch (err) {
    next(err);
  }
};

// 6) Delete menu item
const deleteMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ error: 'MenuItem not found' });
    }
    return res.status(200).json({ message: 'MenuItem deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// 7) Generate coupon
const generateCoupon = async (req, res, next) => {
  try {
    const { type, locationId, ...fields } = req.body;

    // Validate the coupon type as needed...
    // (BOGO, FreeItem, FlatDiscount, etc.)

    const coupon = new Coupon({ type, locationId, ...fields });
    const savedCoupon = await coupon.save();
    return res.status(201).json(savedCoupon);
  } catch (err) {
    next(err);
  }
};

// 8) Update coupon
const updateCoupon = async (req, res, next) => {
  try {
    const { type, ...fields } = req.body;
    // Validate as needed...

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { $set: { type, ...fields } },
      { new: true }
    );
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    return res.status(200).json(coupon);
  } catch (err) {
    next(err);
  }
};

// 9) Activate coupon
const activateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    if (coupon.isActive) {
      return res.status(400).json({ error: 'Coupon is already active.' });
    }
    coupon.isActive = true;
    await coupon.save();
    return res.status(200).json({
      message: 'Coupon activated successfully.',
      coupon,
    });
  } catch (err) {
    next(err);
  }
};

// 10) Deactivate coupon
const deactivateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    if (!coupon.isActive) {
      return res.status(400).json({ error: 'Coupon is already inactive.' });
    }
    coupon.isActive = false;
    await coupon.save();
    return res.status(200).json({
      message: 'Coupon deactivated successfully.',
      coupon,
    });
  } catch (err) {
    next(err);
  }
};

// 11) Delete coupon
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    return res.status(200).json({ message: 'Coupon deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// 12) Redeem coupon
const redeemCoupon = async (req, res, next) => {
  try {
    const { couponId, locationId } = req.body;

    // 1. Verify location
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // 2. Decrement coupon quantity (if active, not expired, quantity > 0)
    const coupon = await Coupon.findOneAndUpdate(
      {
        _id: couponId,
        isActive: true,
        expirationDate: { $gte: new Date() },
        quantity: { $gt: 0 },
      },
      { $inc: { quantity: -1 } },
      { new: true }
    );
    if (!coupon) {
      return res.status(400).json({ error: 'Coupon not available or no quantity left' });
    }

    // 3. Check per-user usage limit
    const redemptionCount = await CouponRedemption.countDocuments({
      couponId: coupon._id,
      userId: req.user.id,
    });
    if (redemptionCount >= (coupon.maxUsagePerUser || 1)) {
      // Revert the decrement
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { quantity: 1 } });
      return res.status(400).json({ error: 'You have already redeemed this coupon' });
    }

    // 4. Log the redemption
    const redemption = new CouponRedemption({
      couponId: coupon._id,
      userId: req.user.id,
      locationId: location._id,
      redeemedAt: new Date(),
    });
    await redemption.save();

    // 5. Respond
    return res.status(200).json({
      message: 'Coupon redeemed successfully',
      coupon,
      redemption,
    });
  } catch (err) {
    next(err);
  }
};

// 13) Add ad
const addAd = async (req, res, next) => {
  try {
    const ad = new Ad({
      ...req.body,
      locationId: req.body.locationId,
    });
    const savedAd = await ad.save();
    return res.status(201).json(savedAd);
  } catch (err) {
    next(err);
  }
};

// 14) Update ad
const updateAd = async (req, res, next) => {
  try {
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    return res.status(200).json(ad);
  } catch (err) {
    next(err);
  }
};

// 15) Delete ad
const deleteAd = async (req, res, next) => {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    return res.status(200).json({ message: 'Ad deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// 16) Send notifications
const sendNotifications = async (req, res, next) => {
  try {
    // Typically you'd verify these customers belong to the same restaurant, etc.
    const notifications = req.body.customers.map((customerId) =>
      new Notification({
        restaurantId: req.user.id,
        customerId,
        type: req.body.type,
        message: req.body.message,
      }).save()
    );
    await Promise.all(notifications);
    return res.status(200).json({ message: 'Notifications sent successfully' });
  } catch (err) {
    next(err);
  }
};

// 17) Update restaurant details
const updateRestaurantDetails = async (req, res, next) => {
  try {
    const restaurant = await User.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true }
    );
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    return res.status(200).json(restaurant);
  } catch (err) {
    next(err);
  }
};

// 18) Store customer info
const storeCustomerInfo = async (req, res, next) => {
  try {
    const customer = new User({
      ...req.body,
      role: 'Customer',
    });
    const savedCustomer = await customer.save();
    return res.status(201).json(savedCustomer);
  } catch (err) {
    next(err);
  }
};

// 19) Update customer info
const updateCustomerInfo = async (req, res, next) => {
  try {
    const customer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'Customer' },
      { $set: req.body },
      { new: true }
    );
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    return res.status(200).json(customer);
  } catch (err) {
    next(err);
  }
};

// 20) Delete customer info
const deleteCustomerInfo = async (req, res, next) => {
  try {
    const customer = await User.findOneAndDelete({
      _id: req.params.id,
      role: 'Customer',
    });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    return res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// 21) Get all coupons for a specific location
const getCouponsByLocationId = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({
      locationId: req.params.locationId,
      isActive: true,
    });
    return res.status(200).json(coupons);
  } catch (err) {
    next(err);
  }
};

// 22) Get locations with coupons and filtering
const getLocationsWithCoupons = async (req, res, next) => {
  try {
    const { latitude, longitude, range = 5, expiringSoon, couponType } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    const locations = await Location.find({
      geolocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseFloat(range) * 1000, // Convert km -> meters
        },
      },
    });

    const locationIds = locations.map((loc) => loc._id);
    const couponFilter = {
      locationId: { $in: locationIds },
      isActive: true,
    };

    if (expiringSoon) {
      couponFilter.expirationDate = { $lt: new Date(Date.now() + 24 * 60 * 60 * 1000) };
    }
    if (couponType) {
      couponFilter.type = couponType;
    }

    const coupons = await Coupon.find(couponFilter);

    const result = locations.map((location) => ({
      ...location.toObject(),
      coupons: coupons.filter((coupon) => coupon.locationId.equals(location._id)),
    }));

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// 23) Add location to Customer favorites
const addLocationToFavorites = async (req, res, next) => {
  try {
    const customer = await User.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    if (customer.role !== 'Customer') {
      return res.status(403).json({ error: 'Only customers can add favorite locations' });
    }

    const { locationId } = req.params;
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (customer.favoritesLocations.includes(locationId)) {
      return res.status(400).json({ error: 'Location is already in your favorites' });
    }

    customer.favoritesLocations.push(locationId);
    await customer.save();

    return res.status(200).json({
      message: 'Location added to favorites successfully',
      favorites: customer.favoritesLocations,
    });
  } catch (err) {
    next(err);
  }
};

// 24) Remove location from Customer favorites
const removeLocationFromFavorites = async (req, res, next) => {
  try {
    const customer = await User.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    if (customer.role !== 'Customer') {
      return res.status(403).json({ error: 'Only customers can remove favorite locations' });
    }

    const { locationId } = req.params;
    customer.favoritesLocations = customer.favoritesLocations.filter(
      (favLocationId) => favLocationId.toString() !== locationId
    );
    await customer.save();

    return res.status(200).json({
      message: 'Location removed from favorites successfully',
      favorites: customer.favoritesLocations,
    });
  } catch (err) {
    next(err);
  }
};

// 25) Get favorite locations for a Customer
const getFavoriteLocations = async (req, res, next) => {
  try {
    const customer = await User.findById(req.user.id)
      .populate('favoritesLocations')
      .exec();

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    if (customer.role !== 'Customer') {
      return res.status(403).json({ error: 'Only customers can view favorite locations' });
    }

    return res.status(200).json(customer.favoritesLocations);
  } catch (err) {
    next(err);
  }
};

// 26) Get all coupons a specific customer used at a given location
const getCouponsUsedByCustomerAtLocation = async (req, res, next) => {
  try {
    const { customerId, locationId } = req.params;

    const redemptions = await CouponRedemption.find({
      userId: customerId,
      locationId,
    })
      .populate('couponId', 'type code discountValue expirationDate')
      .exec();

    // Extract coupons from redemption documents
    const usedCoupons = redemptions.map((r) => r.couponId);

    return res.status(200).json(usedCoupons);
  } catch (err) {
    next(err);
  }
};

// 27) Get redeeming customers by location
const getRedeemingCustomersByLocation = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const redemptions = await CouponRedemption.find({ locationId })
      .populate('userId', 'username email');

    const allUsers = redemptions.map((r) => r.userId);

    // Filter out duplicates
    const uniqueUsersMap = new Map();
    allUsers.forEach((user) => {
      uniqueUsersMap.set(user._id.toString(), user);
    });
    const uniqueUsers = Array.from(uniqueUsersMap.values());

    return res.status(200).json(uniqueUsers);
  } catch (err) {
    next(err);
  }
};

// 28) Link a Cognito user (create if not exists)
const linkUser = async (req, res, next) => {
  try {
    const { cognitoSub, username, email, role } = req.body;
    if (!cognitoSub || !username || !email || !role) {
      return res
        .status(400)
        .json({ error: 'cognitoSub, username, email, and role are required fields.' });
    }

    const existingUser = await User.findOne({ cognitoSub });
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists. Cannot update an existing user.',
      });
    }

    const newUser = new User({ cognitoSub, username, email, role });
    await newUser.save();

    return res.status(201).json({
      message: 'User created successfully.',
      user: newUser,
    });
  } catch (error) {
    console.error('Error in linkUser:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 29) Generate QR code (alternative version)
const generateQR = async (req, res, next) => {
  try {
    const { id } = req.params;
    const location = await Location.findById(id);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const qrCodeText = `${id}`;
    const qrCode = await QRCode.toDataURL(qrCodeText);

    location.qrCode = qrCode;
    await location.save();

    return res.status(200).json({
      message: 'QR code generated successfully',
      qrCode,
    });
  } catch (err) {
    next(err);
  }
};

// Export all 29 methods
module.exports = {
  // Location
  addLocation,
  updateLocation,
  deleteLocation,

  // Menu
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,

  // Coupon
  generateCoupon,
  updateCoupon,
  activateCoupon,
  deactivateCoupon,
  deleteCoupon,
  redeemCoupon,

  // Ads
  addAd,
  updateAd,
  deleteAd,

  // Notifications
  sendNotifications,

  // Restaurant
  updateRestaurantDetails,

  // Customer
  storeCustomerInfo,
  updateCustomerInfo,
  deleteCustomerInfo,

  // Coupon queries
  getCouponsByLocationId,
  getLocationsWithCoupons,

  // Favorites
  addLocationToFavorites,
  removeLocationFromFavorites,
  getFavoriteLocations,

  // Analytics
  getCouponsUsedByCustomerAtLocation,
  getRedeemingCustomersByLocation,

  // Link user
  linkUser,

  // QR
  generateQR,
};
