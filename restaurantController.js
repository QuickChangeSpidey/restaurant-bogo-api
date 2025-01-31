const { User, Location, MenuItem, Coupon, Ad, Notification, CouponRedemption } = require('./models');

// Add a new location
const addLocation = async (req, res, next) => {
    try {
        // Creates a new location referencing the local user ID (Restaurant)
        // RECOMMENDATION: You might also check if req.user.role === 'Restaurant' in the route or here
        // plus confirm that user truly doesn't exceed location limits, etc.
        const location = new Location({
            ...req.body,
            restaurantId: req.user.id,
        });
        const savedLocation = await location.save();
        res.status(201).json(savedLocation);
    } catch (err) {
        next(err);
    }
};

// Update location
const updateLocation = async (req, res, next) => {
    try {
        // RECOMMENDATION: Confirm that the location belongs to req.user.id (if multi-tenant)
        // e.g., await Location.findOneAndUpdate({_id: req.params.id, restaurantId: req.user.id} ...)
        const location = await Location.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!location) return res.status(404).json({ error: 'Location not found' });
        res.status(200).json(location);
    } catch (err) {
        next(err);
    }
};

// Delete location
const deleteLocation = async (req, res, next) => {
    try {
        // RECOMMENDATION: Similarly, confirm location belongs to req.user.id, if needed
        const location = await Location.findByIdAndDelete(req.params.id);
        if (!location) return res.status(404).json({ error: 'Location not found' });
        res.status(200).json({ message: 'Location deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// Add menu item
const addMenuItem = async (req, res, next) => {
    try {
        // RECOMMENDATION: Optionally verify the location belongs to the same user
        const menuItem = new MenuItem({
            ...req.body,
            locationId: req.body.locationId,
        });
        const savedMenuItem = await menuItem.save();
        res.status(201).json(savedMenuItem);
    } catch (err) {
        next(err);
    }
};

// Update menu item
const updateMenuItem = async (req, res, next) => {
    try {
        // RECOMMENDATION: Also optionally confirm the menu item’s location belongs to this user
        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!menuItem) return res.status(404).json({ error: 'MenuItem not found' });
        res.status(200).json(menuItem);
    } catch (err) {
        next(err);
    }
};

// Delete menu item
const deleteMenuItem = async (req, res, next) => {
    try {
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
        if (!menuItem) return res.status(404).json({ error: 'MenuItem not found' });
        res.status(200).json({ message: 'MenuItem deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// Coupon generator
const generateCoupon = async (req, res, next) => {
    try {
        const { type, locationId, ...fields } = req.body;

        // Validate the coupon type
        switch (type) {
            case 'BOGO':
                if (!fields.comboItems || fields.comboItems.length < 1) {
                    return res.status(400).json({ error: 'BOGO deals require at least one item.' });
                }
                break;
            case 'FreeItem':
                if (!fields.freeItemId || !fields.minimumSpend) {
                    return res.status(400).json({ error: 'FreeItem deals require a free item and a minimum spend.' });
                }
                break;
            case 'FlatDiscount':
                if (!fields.discountValue || !fields.minimumSpend) {
                    return res.status(400).json({ error: 'FlatDiscount requires a discount value and minimum spend.' });
                }
                break;
            case 'SpendMoreSaveMore':
                if (!fields.minimumSpend || !fields.discountValue) {
                    return res.status(400).json({ error: 'SpendMoreSaveMore requires spend threshold and discount value.' });
                }
                break;
            case 'ComboDeal':
            case 'FamilyPack':
                if (!fields.comboItems || fields.comboItems.length < 2) {
                    return res.status(400).json({ error: `${type} deals require at least two items.` });
                }
                break;
            case 'LimitedTime':
            case 'HappyHour':
                if (!fields.startTime || !fields.endTime || !fields.discountValue) {
                    return res.status(400).json({ error: `${type} deals require start and end times and a discount value.` });
                }
                break;
            default:
                return res.status(400).json({ error: 'Invalid coupon type.' });
        }

        // RECOMMENDATION: Optionally confirm location belongs to this restaurant user
        const coupon = new Coupon({ type, locationId, ...fields });
        const savedCoupon = await coupon.save();
        res.status(201).json(savedCoupon);
    } catch (err) {
        next(err);
    }
};

// Coupon Update
const updateCoupon = async (req, res, next) => {
    try {
        const { type, ...fields } = req.body;

        switch (type) {
            case 'BOGO':
                if (!fields.comboItems || fields.comboItems.length < 1) {
                    return res.status(400).json({ error: 'BOGO deals require at least one item.' });
                }
                break;
            case 'FreeItem':
                if (!fields.freeItemId || !fields.minimumSpend) {
                    return res.status(400).json({ error: 'FreeItem deals require a free item and a minimum spend.' });
                }
                break;
            case 'FlatDiscount':
                if (!fields.discountValue || !fields.minimumSpend) {
                    return res.status(400).json({ error: 'FlatDiscount requires a discount value and minimum spend.' });
                }
                break;
            case 'SpendMoreSaveMore':
                if (!fields.minimumSpend || !fields.discountValue) {
                    return res.status(400).json({ error: 'SpendMoreSaveMore requires spend threshold and discount value.' });
                }
                break;
            case 'ComboDeal':
            case 'FamilyPack':
                if (!fields.comboItems || fields.comboItems.length < 2) {
                    return res.status(400).json({ error: `${type} deals require at least two items.` });
                }
                break;
            case 'LimitedTime':
            case 'HappyHour':
                if (!fields.startTime || !fields.endTime || !fields.discountValue) {
                    return res.status(400).json({ error: `${type} deals require start and end times and a discount value.` });
                }
                break;
            default:
                return res.status(400).json({ error: 'Invalid coupon type.' });
        }

        // RECOMMENDATION: Optionally check the coupon belongs to user’s location
        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            { $set: { type, ...fields } },
            { new: true }
        );

        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
        res.status(200).json(coupon);
    } catch (err) {
        next(err);
    }
};

// Activate Coupon 
const activateCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

        if (coupon.isActive) {
            return res.status(400).json({ error: 'Coupon is already active.' });
        }

        coupon.isActive = true;
        await coupon.save();

        res.status(200).json({ message: 'Coupon activated successfully.', coupon });
    } catch (err) {
        next(err);
    }
};

// Deactivate Coupon 
const deactivateCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

        if (!coupon.isActive) {
            return res.status(400).json({ error: 'Coupon is already inactive.' });
        }

        coupon.isActive = false;
        await coupon.save();

        res.status(200).json({ message: 'Coupon deactivated successfully.', coupon });
    } catch (err) {
        next(err);
    }
};

// Delete Coupon 
const deleteCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

        res.status(200).json({ message: 'Coupon deleted successfully.' });
    } catch (err) {
        next(err);
    }
};

// Add ad
const addAd = async (req, res, next) => {
    try {
        const ad = new Ad({
            ...req.body,
            locationId: req.body.locationId,
        });
        // RECOMMENDATION: confirm the user is the location’s restaurant
        const savedAd = await ad.save();
        res.status(201).json(savedAd);
    } catch (err) {
        next(err);
    }
};

// Update ad
const updateAd = async (req, res, next) => {
    try {
        // RECOMMENDATION: confirm the ad belongs to user
        const ad = await Ad.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!ad) return res.status(404).json({ error: 'Ad not found' });
        res.status(200).json(ad);
    } catch (err) {
        next(err);
    }
};

// Delete ad
const deleteAd = async (req, res, next) => {
    try {
        // RECOMMENDATION: confirm the ad belongs to user
        const ad = await Ad.findByIdAndDelete(req.params.id);
        if (!ad) return res.status(404).json({ error: 'Ad not found' });
        res.status(200).json({ message: 'Ad deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// Send notifications
const sendNotifications = async (req, res, next) => {
    try {
        // RECOMMENDATION: if you only want to notify customers belonging to your restaurant,
        // you'd validate that somehow. This code assumes you pass in an array of customer IDs you want to notify.
        const notifications = req.body.customers.map((customerId) =>
            new Notification({
                restaurantId: req.user.id,
                customerId,
                type: req.body.type,
                message: req.body.message,
            }).save()
        );
        await Promise.all(notifications);
        res.status(200).json({ message: 'Notifications sent successfully' });
    } catch (err) {
        next(err);
    }
};

// Update restaurant details
const updateRestaurantDetails = async (req, res, next) => {
    try {
        // This updates the local user doc for the restaurant
        // If you’re purely using Cognito for auth, you might store changes differently or skip password updates
        const restaurant = await User.findByIdAndUpdate(
            req.user.id,
            { $set: req.body },
            { new: true }
        );
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
        res.status(200).json(restaurant);
    } catch (err) {
        next(err);
    }
};

// Store customer info
const storeCustomerInfo = async (req, res, next) => {
    try {
        // Creates a new local user with role "Customer"
        // RECOMMENDATION: If you use Cognito for actual sign-up, you might only store "cognitoSub" or "email"
        //   and skip local passwords. This depends on your design.
        const customer = new User({
            ...req.body,
            role: 'Customer',
        });
        const savedCustomer = await customer.save();
        res.status(201).json(savedCustomer);
    } catch (err) {
        next(err);
    }
};

// Update customer info
const updateCustomerInfo = async (req, res, next) => {
    try {
        // Finds the user by _id and role: 'Customer', then updates
        const customer = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'Customer' },
            { $set: req.body },
            { new: true }
        );
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.status(200).json(customer);
    } catch (err) {
        next(err);
    }
};

// Delete customer info
const deleteCustomerInfo = async (req, res, next) => {
    try {
        const customer = await User.findOneAndDelete({
            _id: req.params.id,
            role: 'Customer',
        });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// Get all coupons for a specific location
const getCouponsByLocationId = async (req, res, next) => {
    try {
        // Returns only active coupons
        const coupons = await Coupon.find({ locationId: req.params.locationId, isActive: true });
        res.status(200).json(coupons);
    } catch (err) {
        next(err);
    }
};

// Get locations with coupons and filtering
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
                    $maxDistance: parseFloat(range) * 1000, // Convert km to meters
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

        // Attach each location's active coupons
        const result = locations.map((location) => ({
            ...location.toObject(),
            coupons: coupons.filter((coupon) => coupon.locationId.equals(location._id)),
        }));

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

// Add location to Customer favorites
const addLocationToFavorites = async (req, res, next) => {
    try {
        // The ID of the currently logged-in user (Customer)
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

        res.status(200).json({
            message: 'Location added to favorites successfully',
            favorites: customer.favoritesLocations,
        });
    } catch (err) {
        next(err);
    }
};

// Remove location from Customer favorites
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

        res.status(200).json({
            message: 'Location removed from favorites successfully',
            favorites: customer.favoritesLocations,
        });
    } catch (err) {
        next(err);
    }
};

// Redeem a coupon (Customer role)
const redeemCoupon = async (req, res, next) => {
    try {
        const { couponId, locationId } = req.body;

        // 1. Verify location
        const location = await Location.findById(locationId);
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }

        // 2. Atomically decrement coupon quantity (if active, not expired, quantity > 0)
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

        // If null, the coupon is not available or quantity = 0
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
        res.status(200).json({
            message: 'Coupon redeemed successfully',
            coupon,
            redemption,
        });
    } catch (err) {
        next(err);
    }
};

// Get favorite locations for a Customer
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

        res.status(200).json(customer.favoritesLocations);
    } catch (err) {
        next(err);
    }
};

/**
 * Get all coupons a specific customer used at a given location
 */
const getCouponsUsedByCustomerAtLocation = async (req, res, next) => {
    try {
      const { customerId, locationId } = req.params;
      
      // 1) Find all redemption records for this customer at this location
      const redemptions = await CouponRedemption.find({
        userId: customerId,
        locationId
      })
        // 2) Populate the coupon details (e.g., type, code, discountValue)
        .populate('couponId', 'type code discountValue expirationDate')
        // (Optional) also populate the location or user if you need that info
        // .populate('locationId', 'name address')
        .exec();
  
      // 3) Extract the actual coupons from each redemption
      //    (They are in redemption.couponId because of the populate)
      const usedCoupons = redemptions.map((redemption) => redemption.couponId);
  
      // 4) Return them to the client
      res.status(200).json(usedCoupons);
    } catch (err) {
      next(err);
    }
  };

  const getRedeemingCustomersByLocation = async (req, res, next) => {
    try {
        const { locationId } = req.params;

        // 1) Find all redemption records for this location
        const redemptions = await CouponRedemption.find({ locationId })
            .populate('userId', 'username email'); 
        // .populate('userId') would load the full user doc
        // Passing second param 'username email' picks only these fields

        // 2) Extract user objects
        const allUsers = redemptions.map(r => r.userId);

        // 3) Filter out duplicates
        const uniqueUsersMap = new Map();
        allUsers.forEach((user) => {
            uniqueUsersMap.set(user._id.toString(), user);
        });
        const uniqueUsers = Array.from(uniqueUsersMap.values());

        res.status(200).json(uniqueUsers);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    addLocation,
    updateLocation,
    deleteLocation,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    generateCoupon,
    activateCoupon,
    deactivateCoupon,
    deleteCoupon,
    updateCoupon,
    addAd,
    updateAd,
    deleteAd,
    sendNotifications,
    updateRestaurantDetails,
    storeCustomerInfo,
    updateCustomerInfo,
    deleteCustomerInfo,
    getCouponsByLocationId,
    getLocationsWithCoupons,
    addLocationToFavorites,
    removeLocationFromFavorites,
    getFavoriteLocations,
    redeemCoupon,
    getCouponsUsedByCustomerAtLocation,
    getRedeemingCustomersByLocation
};
