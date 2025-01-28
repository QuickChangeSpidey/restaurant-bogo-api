const { ObjectId } = require('mongodb');

// Add a new location
const addLocation = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const location = await db.collection('locations').insertOne({
            ...req.body,
            restaurantId: new ObjectId(req.user.id),
        });
        res.status(201).json(location.ops[0]);
    } catch (err) {
        next(err);
    }
};

// Update location
const updateLocation = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const location = await db
            .collection('locations')
            .findOneAndUpdate({ _id: new ObjectId(req.params.id) }, { $set: req.body }, { returnDocument: 'after' });
        if (!location.value) return res.status(404).json({ error: 'Location not found' });
        res.status(200).json(location.value);
    } catch (err) {
        next(err);
    }
};

// Delete location
const deleteLocation = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const location = await db.collection('locations').deleteOne({ _id: new ObjectId(req.params.id) });
        if (!location.deletedCount) return res.status(404).json({ error: 'Location not found' });
        res.status(200).json({ message: 'Location deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// Add menu item
const addMenuItem = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const menuItem = await db.collection('menuItems').insertOne({
            ...req.body,
            locationId: new ObjectId(req.body.locationId),
        });
        res.status(201).json(menuItem.ops[0]);
    } catch (err) {
        next(err);
    }
};

// Update menu item
const updateMenuItem = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const menuItem = await db
            .collection('menuItems')
            .findOneAndUpdate(
                { _id: new ObjectId(req.params.id) },
                { $set: req.body },
                { returnDocument: 'after' }
            );
        if (!menuItem.value) return res.status(404).json({ error: 'MenuItem not found' });
        res.status(200).json(menuItem.value);
    } catch (err) {
        next(err);
    }
};

// Delete menu item
const deleteMenuItem = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const menuItem = await db.collection('menuItems').deleteOne({ _id: new ObjectId(req.params.id) });
        if (!menuItem.deletedCount) return res.status(404).json({ error: 'MenuItem not found' });
        res.status(200).json({ message: 'MenuItem deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// Generate coupon
const generateCoupon = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const coupon = await db.collection('coupons').insertOne({
            ...req.body,
            locationId: new ObjectId(req.body.locationId),
        });
        res.status(201).json(coupon.ops[0]);
    } catch (err) {
        next(err);
    }
};

// Get all coupons for a specific location
const getCouponsByLocationId = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const locationId = req.params.locationId;

        // Find all coupons for the given location ID
        const coupons = await db.collection('coupons').find({ locationId: new ObjectId(locationId) }).toArray();

        res.status(200).json(coupons);
    } catch (err) {
        next(err);
    }
};


// Activate coupon
const activateCoupon = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const coupon = await db
            .collection('coupons')
            .findOneAndUpdate(
                { _id: new ObjectId(req.params.id) },
                { $set: { isActive: true } },
                { returnDocument: 'after' }
            );
        if (!coupon.value) return res.status(404).json({ error: 'Coupon not found' });
        res.status(200).json(coupon.value);
    } catch (err) {
        next(err);
    }
};

// Deactivate coupon
const deactivateCoupon = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const coupon = await db
            .collection('coupons')
            .findOneAndUpdate(
                { _id: new ObjectId(req.params.id) },
                { $set: { isActive: false } },
                { returnDocument: 'after' }
            );
        if (!coupon.value) return res.status(404).json({ error: 'Coupon not found' });
        res.status(200).json(coupon.value);
    } catch (err) {
        next(err);
    }
};

// Add ad
const addAd = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const ad = await db.collection('ads').insertOne({
            ...req.body,
            locationId: new ObjectId(req.body.locationId),
        });
        res.status(201).json(ad.ops[0]);
    } catch (err) {
        next(err);
    }
};

// Update ad
const updateAd = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const ad = await db
            .collection('ads')
            .findOneAndUpdate(
                { _id: new ObjectId(req.params.id) },
                { $set: req.body },
                { returnDocument: 'after' }
            );
        if (!ad.value) return res.status(404).json({ error: 'Ad not found' });
        res.status(200).json(ad.value);
    } catch (err) {
        next(err);
    }
};

// Delete ad
const deleteAd = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const ad = await db.collection('ads').deleteOne({ _id: new ObjectId(req.params.id) });
        if (!ad.deletedCount) return res.status(404).json({ error: 'Ad not found' });
        res.status(200).json({ message: 'Ad deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// Send notifications
const sendNotifications = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const notifications = req.body.customers.map((customerId) =>
            db.collection('notifications').insertOne({
                restaurantId: new ObjectId(req.user.id),
                customerId: new ObjectId(customerId),
                type: req.body.type,
                message: req.body.message,
                createdAt: new Date(),
            })
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
        const db = req.app.locals.db;
        const restaurant = await db
            .collection('users')
            .findOneAndUpdate(
                { _id: new ObjectId(req.user.id) },
                { $set: req.body },
                { returnDocument: 'after' }
            );
        if (!restaurant.value) return res.status(404).json({ error: 'Restaurant not found' });
        res.status(200).json(restaurant.value);
    } catch (err) {
        next(err);
    }
};

// Store customer info
const storeCustomerInfo = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const customer = await db.collection('users').insertOne({
            ...req.body,
            role: 'Customer',
        });
        res.status(201).json(customer.ops[0]);
    } catch (err) {
        next(err);
    }
};

// Update customer info
const updateCustomerInfo = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const customer = await db
            .collection('users')
            .findOneAndUpdate(
                { _id: new ObjectId(req.params.id), role: 'Customer' },
                { $set: req.body },
                { returnDocument: 'after' }
            );
        if (!customer.value) return res.status(404).json({ error: 'Customer not found' });
        res.status(200).json(customer.value);
    } catch (err) {
        next(err);
    }
};

// Delete coupon
const deleteCoupon = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        // Delete the coupon based on the provided ID
        const result = await db.collection('coupons').deleteOne({ _id: new ObjectId(req.params.id) });

        // Check if a coupon was actually deleted
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        // If successful, return a success message
        res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (err) {
        next(err); // Pass error to error-handling middleware
    }
};

// Update Coupon
const updateCoupon = async (req, res, next) => {
    try {
        const db = req.app.locals.db;

        // Update the coupon based on the provided ID
        const result = await db
            .collection('coupons')
            .findOneAndUpdate(
                { _id: new ObjectId(req.params.id) }, // Match the coupon by ID
                { $set: req.body },                  // Update with data from request body
                { returnDocument: 'after' }          // Return the updated document
            );

        // Check if a coupon was actually found and updated
        if (!result.value) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        // If successful, return the updated coupon
        res.status(200).json(result.value);
    } catch (err) {
        next(err); // Pass error to error-handling middleware
    }
};



// Delete customer info
const deleteCustomerInfo = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const customer = await db
            .collection('users')
            .deleteOne({ _id: new ObjectId(req.params.id), role: 'Customer' });
        if (!customer.deletedCount) return res.status(404).json({ error: 'Customer not found' });
        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (err) {
        next(err);
    }
};

const getLocationsWithCoupons = async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const { latitude, longitude, range = 5, expiringSoon, couponType } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude are required.' });
        }

        // Convert range from kilometers to meters
        const rangeInMeters = parseFloat(range) * 1000;

        // Find locations within the specified range
        const locations = await db.collection('locations').find({
            geolocation: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: rangeInMeters
                }
            }
        }).toArray();

        // Retrieve active coupons for each location
        const locationIds = locations.map(loc => loc._id);
        const couponFilter = {
            locationId: { $in: locationIds },
            isActive: true
        };

        if (expiringSoon) {
            couponFilter.expiryDate = { $lt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000) }; // Expiring within 24 hours
        }

        if (couponType) {
            couponFilter.type = couponType;
        }

        const coupons = await db.collection('coupons').find(couponFilter).toArray();

        // Group coupons by location
        const result = locations.map(location => {
            const locationCoupons = coupons.filter(coupon => coupon.locationId.equals(location._id));
            return {
                ...location,
                coupons: locationCoupons
            };
        });

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
    addAd,
    updateAd,
    deleteAd,
    sendNotifications,
    updateRestaurantDetails,
    storeCustomerInfo,
    updateCustomerInfo,
    deleteCustomerInfo,
    deleteCoupon,
    updateCoupon,
    getCouponsByLocationId,
    getLocationsWithCoupons
};
