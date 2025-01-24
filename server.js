// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const QRCode = require('qrcode'); // Add QR code generation dependency

// Create express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/restaurantApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Schemas and Models

// User schema (Admin, Restaurant, Customer)
const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    role: { type: String, enum: ['Admin', 'Restaurant', 'Customer'] },
    favoritedRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
});
const User = mongoose.model('User', UserSchema);

// Restaurant schema
const LocationSchema = new mongoose.Schema({
    logo: String,
    address: String,
    hours: String,
    qrCode: String, // Static QR code (unique ID of location)
    menuItems: [
        {
            image: String,
            price: Number,
            description: String,
        },
    ],
    coupons: [
        {
            type: String, // Type of coupon (e.g., Discount, BOGO, etc.)
            number: Number,
            expirationDate: Date,
            generationDate: { type: Date, default: Date.now },
        },
    ],
    ads: [
        {
            type: { type: String, enum: ['Video', 'Photo'] },
            content: String, // URL or file path
        },
    ],
});

const RestaurantSchema = new mongoose.Schema({
    name: String,
    locations: [LocationSchema],
});
const Restaurant = mongoose.model('Restaurant', RestaurantSchema);

// Endpoints

// Restaurant endpoints
app.post('/restaurants', async (req, res) => {
    try {
        const restaurant = new Restaurant(req.body);
        await restaurant.save();
        res.status(201).json(restaurant);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/restaurants/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(restaurant);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/restaurants/:id', async (req, res) => {
    try {
        await Restaurant.findByIdAndDelete(req.params.id);
        res.json({ message: 'Restaurant deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Add location
app.post('/restaurants/:id/locations', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        const newLocation = req.body;
        newLocation.qrCode = await QRCode.toDataURL(newLocation.address); // Generate QR Code for location
        restaurant.locations.push(newLocation);
        await restaurant.save();
        res.status(201).json(restaurant);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update location
app.put('/restaurants/:restaurantId/locations/:locationId', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        const location = restaurant.locations.id(req.params.locationId);
        Object.assign(location, req.body);
        await restaurant.save();
        res.json(restaurant);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete location
app.delete('/restaurants/:restaurantId/locations/:locationId', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        restaurant.locations.id(req.params.locationId).remove();
        await restaurant.save();
        res.json({ message: 'Location deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Add menu item
app.post('/restaurants/:restaurantId/locations/:locationId/menu-items', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        const location = restaurant.locations.id(req.params.locationId);
        location.menuItems.push(req.body);
        await restaurant.save();
        res.status(201).json(location);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update menu item
app.put('/restaurants/:restaurantId/locations/:locationId/menu-items/:menuItemId', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        const location = restaurant.locations.id(req.params.locationId);
        const menuItem = location.menuItems.id(req.params.menuItemId);
        Object.assign(menuItem, req.body);
        await restaurant.save();
        res.json(location);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete menu item
app.delete('/restaurants/:restaurantId/locations/:locationId/menu-items/:menuItemId', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        const location = restaurant.locations.id(req.params.locationId);
        location.menuItems.id(req.params.menuItemId).remove();
        await restaurant.save();
        res.json({ message: 'Menu item deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Redeem coupon
app.post('/locations/:locationId/coupons/:couponId/redeem', async (req, res) => {
    try {
        const { customerId } = req.body;
        const restaurant = await Restaurant.findOne({ 'locations._id': req.params.locationId });
        const location = restaurant.locations.id(req.params.locationId);
        const coupon = location.coupons.id(req.params.couponId);

        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        // Validate expiration
        if (new Date() > coupon.expirationDate) {
            return res.status(400).json({ error: 'Coupon has expired' });
        }

        // Reduce coupon count
        if (coupon.number <= 0) {
            return res.status(400).json({ error: 'Coupon is no longer available' });
        }
        coupon.number -= 1;
        await restaurant.save();

        res.json({ message: 'Coupon redeemed successfully', customerId, locationId: req.params.locationId, couponId: req.params.couponId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update coupon
app.put('/restaurants/:restaurantId/locations/:locationId/coupons/:couponId', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        const location = restaurant.locations.id(req.params.locationId);
        const coupon = location.coupons.id(req.params.couponId);
        Object.assign(coupon, req.body);
        await restaurant.save();
        res.json(location);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete coupon
app.delete('/restaurants/:restaurantId/locations/:locationId/coupons/:couponId', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        const location = restaurant.locations.id(req.params.locationId);
        location.coupons.id(req.params.couponId).remove();
        await restaurant.save();
        res.json({ message: 'Coupon deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Customer endpoints
app.get('/restaurants/nearby', async (req, res) => {
    try {
        // Implement logic to fetch nearby restaurants (e.g., geolocation)
        const restaurants = await Restaurant.find();
        res.json(restaurants);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/restaurants/search', async (req, res) => {
    try {
        const { name, address, coupon } = req.query;
        const query = {
            $or: [
                { name: new RegExp(name, 'i') },
                { 'locations.address': new RegExp(address, 'i') },
                { 'locations.coupons.type': new RegExp(coupon, 'i') },
            ],
        };
        const restaurants = await Restaurant.find(query);
        res.json(restaurants);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/locations/:locationId/coupons', async (req, res) => {
    try {
        const location = await Restaurant.findOne(
            { 'locations._id': req.params.locationId },
            { 'locations.$': 1 }
        );
        res.json(location);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
