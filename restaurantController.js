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
      restaurantId: req.user.sub,
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

// CREATE a new coupon
const generateCoupon = async (req, res, next) => {
  try {
    const {
      type,
      locationId,
      code,
      expirationDate,
      discountPercentage,
      discountValue,
      purchasedItemIds,
      freeItemIds,
      minimumSpend,
      spendThresholds,
      startHour,
      endHour,
      comboItems,
      comboPrice,
      portionSize,
      startTime,
      endTime,
      description,
      quantity,
      familyPackItems,
      familyPackPrice,
      maxUsagePerUser
    } = req.body;

    // Basic required validations
    if (!locationId) {
      return res.status(400).json({ error: 'locationId is required' });
    }
    if (!type) {
      return res.status(400).json({ error: 'type is required' });
    }
    if (!code) {
      return res.status(400).json({ error: 'code is required' });
    }
    if (!expirationDate) {
      return res.status(400).json({ error: 'expirationDate is required' });
    }

    // More specific validations
    // E.g. if type is 'StorewideFlatDiscount' but discountPercentage is missing
    if (type === 'StorewideFlatDiscount' && (discountPercentage == null || discountPercentage <= 0)) {
      return res
        .status(400)
        .json({ error: 'discountPercentage must be > 0 for StorewideFlatDiscount' });
    }

    // ... you can add as many type-based validations as you need ...

    // Create & save
    const newCoupon = new Coupon({
      type,
      locationId,
      code,
      expirationDate,
      discountPercentage,
      discountValue,
      purchasedItemIds,
      freeItemIds,
      minimumSpend,
      familyPackItems,
      familyPackPrice,
      spendThresholds,
      startHour,
      endHour,
      comboItems,
      comboPrice,
      portionSize,
      startTime,
      description,
      endTime,
      quantity,
      maxUsagePerUser
      // isActive defaults to true
    });

    const savedCoupon = await newCoupon.save();
    return res.status(201).json(savedCoupon);
  } catch (err) {
    next(err);
  }
};

// UPDATE an existing coupon
const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    // NOTE: This merges the request body into the $set object, so partial updates are allowed.
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedCoupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    return res.status(200).json(updatedCoupon);
  } catch (err) {
    next(err);
  }
};

// DELETE a coupon (permanently remove from DB)
const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Coupon not found or already deleted' });
    }

    return res.status(200).json({ message: 'Coupon successfully deleted' });
  } catch (err) {
    next(err);
  }
};

// ACTIVATE a coupon (set isActive = true)
const activateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: { isActive: true } },
      { new: true }
    );
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    return res.status(200).json({ message: 'Coupon activated', coupon });
  } catch (err) {
    next(err);
  }
};

// DEACTIVATE a coupon (set isActive = false)
const deactivateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    return res.status(200).json({ message: 'Coupon deactivated', coupon });
  } catch (err) {
    next(err);
  }
};

// GET all coupons (optionally filter by location or type)
const getAllCoupons = async (req, res, next) => {
  try {
    const { locationId, type, isActive } = req.query;
    const filter = {};
    if (locationId) filter.locationId = locationId;
    if (type) filter.type = type;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const coupons = await Coupon.find(filter);
    return res.status(200).json(coupons);
  } catch (err) {
    next(err);
  }
};

// GET single coupon by ID
const getCouponById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    return res.status(200).json(coupon);
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
      userId: req.user.sub,
    });
    if (redemptionCount >= (coupon.maxUsagePerUser || 1)) {
      // Revert the decrement
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { quantity: 1 } });
      return res.status(400).json({ error: 'You have already redeemed this coupon' });
    }

    // 4. Log the redemption
    const redemption = new CouponRedemption({
      couponId: coupon._id,
      userId: req.user.sub,
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
        restaurantId: req.user.sub,
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
      req.user.sub,
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
    const coupons = await Coupon.find({ locationId: req.params.locationId })
      .populate({
        path: 'purchasedItemIds',
        select: 'name'
      })
      .populate({
        path: 'freeItemIds',
        select: 'name'
      })
      .populate({
        path: 'familyPackItems',
        select: 'name'
      })
      .populate({
        path: 'comboItems',
        select: 'name'
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
    const customer = await User.findById(req.user.sub);
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
    const customer = await User.findById(req.user.sub);
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
    const customer = await User.findById(req.user.sub)
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
const acceptPolicy = async (req, res) => {
  try {
    const { userId } = req.params; // Extract user ID from request parameters
    const { isPolicyAccepted } = req.body; // Get new policy status from request body

    if (typeof isPolicyAccepted !== 'boolean') {
      return res.status(400).json({ message: 'Invalid value for isPolicyAccepted' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isPolicyAccepted },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Policy acceptance updated', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 30) Get a specific coupon for a location
const getCouponAtLocation = async (req, res, next) => {
  try {
    const { locationId, couponId } = req.params;

    // Optionally verify that the location exists
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Find the coupon with the given couponId that belongs to the location
    const coupon = await Coupon.findOne({ _id: couponId, locationId });
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found for this location' });
    }

    return res.status(200).json(coupon);
  } catch (err) {
    next(err);
  }
};

// 30) Get all locations for the authenticated restaurant
const getLocationsByRestaurant = async (req, res, next) => {
  try {
    // Assumes the authenticated user is a Restaurant
    const locations = await Location.find({ restaurantId: req.user.sub });
    return res.status(200).json(locations);
  } catch (err) {
    next(err);
  }
};

const getLocationsByGenre = async (req, res, next) => {
  try {
    const { lat, long, radius = 5000 } = req.query; // Default radius 5km

    if (!lat || !long) {
      return res.status(400).json({ message: "Latitude and longitude are required." });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(long);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Invalid latitude or longitude." });
    }

    // 🔍 Find locations within the given radius using geospatial query
    const locations = await Location.find({
      geolocation: {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: parseInt(radius) // Distance in meters
        }
      }
    }).select("name logo genre address coupons");

    if (!locations.length) {
      return res.status(404).json({ message: "No restaurants found nearby." });
    }

    // 📌 Group locations by genre & calculate coupon count
    const groupedByGenre = locations.reduce((acc, location) => {
      if (!location.genre || location.genre.length === 0) return acc;

      location.genre.forEach((genre) => {
        if (!acc[genre]) {
          acc[genre] = {
            totalCoupons: 0,
            restaurants: []
          };
        }

        const couponCount = location.coupons ? location.coupons.length : 0;
        acc[genre].totalCoupons += couponCount;

        acc[genre].restaurants.push({
          id: location._id,
          name: location.name,
          logo: location.logo,
          address: location.address,
          couponCount
        });
      });

      return acc;
    }, {});

    res.json({ restaurants: groupedByGenre });

  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


// 31) Get a specific location by ID
const getLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    return res.status(200).json(location);
  } catch (err) {
    next(err);
  }
};

// 32) Get all menu items for a location
const getMenuItemsByLocation = async (req, res, next) => {
  try {
    const { locationId } = req.params;

    // Optionally verify that the location exists before proceeding.
    // const location = await Location.findById(locationId);
    // if (!location) {
    //   return res.status(404).json({ error: 'Location not found' });
    // }

    // Find all menu items belonging to the given location
    const menuItems = await MenuItem.find({ locationId });
    return res.status(200).json(menuItems);
  } catch (err) {
    next(err);
  }
};

// 33) Get a specific menu item for a location
const getMenuItemByLocation = async (req, res, next) => {
  try {
    const { locationId, menuItemId } = req.params;

    // Optionally verify that the location exists.
    // const location = await Location.findById(locationId);
    // if (!location) {
    //   return res.status(404).json({ error: 'Location not found' });
    // }

    // Find the menu item that matches both the menuItemId and locationId
    const menuItem = await MenuItem.findOne({ _id: menuItemId, locationId });
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found for this location' });
    }
    return res.status(200).json(menuItem);
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
  getLocationsByRestaurant,
  getLocation,

  // Menu
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemByLocation,
  getMenuItemsByLocation,

  // Coupon
  generateCoupon,
  updateCoupon,
  activateCoupon,
  deactivateCoupon,
  deleteCoupon,
  redeemCoupon,
  getCouponsByLocationId,
  getLocationsWithCoupons,
  getCouponAtLocation,
  getAllCoupons,
  getCouponById,

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

  // Favorites
  addLocationToFavorites,
  removeLocationFromFavorites,
  getFavoriteLocations,

  // Analytics
  getCouponsUsedByCustomerAtLocation,
  getRedeemingCustomersByLocation,

  // Link user
  linkUser,

  // policy
  acceptPolicy,
  getLocationsByGenre
};
