const { User, Location, MenuItem, Coupon, Ad, Notification, CouponRedemption } = require('./models');

// Add a new location
const addLocation = async (req, res, next) => {
    try {
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
        const savedAd = await ad.save();
        res.status(201).json(savedAd);
    } catch (err) {
        next(err);
    }
};

// Update ad
const updateAd = async (req, res, next) => {
    try {
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
                    $maxDistance: parseFloat(range) * 1000,
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

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const addLocationToFavorites = async (req, res, next) => {
    try {
      // The ID of the currently logged-in user (Customer)
      const customer = await User.findById(req.user.id);
  
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
  
      // Optionally double-check the user's role
      if (customer.role !== 'Customer') {
        return res.status(403).json({ error: 'Only customers can add favorite locations' });
      }
  
      // Check if the Location exists
      const { locationId } = req.params;
      const location = await Location.findById(locationId);
      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }
  
      // If it's already in favorites, handle accordingly
      if (customer.favoritesLocations.includes(locationId)) {
        return res.status(400).json({ error: 'Location is already in your favorites' });
      }
  
      // Add the location to the favorites array
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
  
      // Filter out the locationId from the array
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
        // Or use req.params if that suits your route design

        // 1. Verify location
        const location = await Location.findById(locationId);
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }

        // 2. Atomically decrement the coupon quantity
        //    We also check that the coupon is active, not expired, and has quantity > 0
        const coupon = await Coupon.findOneAndUpdate(
            {
                _id: couponId,
                isActive: true,
                expirationDate: { $gte: new Date() }, // not expired
                quantity: { $gt: 0 }, // must be > 0
            },
            { $inc: { quantity: -1 } }, // decrement quantity
            { new: true }               // return the updated document
        );

        // If null, coupon was not found or had no remaining quantity
        if (!coupon) {
            return res.status(400).json({ error: 'Coupon not available or no quantity left' });
        }

        // 3. (Optional) Check if this user has already redeemed this coupon
        //    if you have per-user usage limit logic:
        const redemptionCount = await CouponRedemption.countDocuments({
            couponId: coupon._id,
            userId: req.user.id,
        });
        if (redemptionCount >= (coupon.maxUsagePerUser || 1)) {
            // Revert the decrement if needed
            await Coupon.findByIdAndUpdate(coupon._id, { $inc: { quantity: 1 } });
            return res.status(400).json({ error: 'You have already redeemed this coupon' });
        }

        // 4. Log redemption
        const redemption = new CouponRedemption({
            couponId: coupon._id,
            userId: req.user.id,
            locationId: location._id,
            redeemedAt: new Date(),
        });
        await redemption.save();

        // 5. Respond to client
        res.status(200).json({
            message: 'Coupon redeemed successfully',
            coupon,
            redemption,
        });
    } catch (err) {
        next(err);
    }
};
  const getFavoriteLocations = async (req, res, next) => {
    try {
      const customer = await User.findById(req.user.id)
        .populate('favoritesLocations') // populates location documents
        .exec();
  
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
  
      if (customer.role !== 'Customer') {
        return res.status(403).json({ error: 'Only customers can view favorite locations' });
      }
  
      // The populated location documents will be in `customer.favoritesLocations`
      res.status(200).json(customer.favoritesLocations);
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
    redeemCoupon
};
