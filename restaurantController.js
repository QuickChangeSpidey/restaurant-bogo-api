const { User, Location, MenuItem, Coupon, Ad, Notification } = require('./models');

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

// Generate coupon
const generateCoupon = async (req, res, next) => {
    try {
        const coupon = new Coupon({
            ...req.body,
            locationId: req.body.locationId,
        });
        const savedCoupon = await coupon.save();
        res.status(201).json(savedCoupon);
    } catch (err) {
        next(err);
    }
};

// Activate coupon
const activateCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            { $set: { isActive: true } },
            { new: true }
        );
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
        res.status(200).json(coupon);
    } catch (err) {
        next(err);
    }
};

// Deactivate coupon
const deactivateCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            { $set: { isActive: false } },
            { new: true }
        );
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
        res.status(200).json(coupon);
    } catch (err) {
        next(err);
    }
};

// Delete coupon
const deleteCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
        res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// Update coupon
const updateCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
        res.status(200).json(coupon);
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
};
