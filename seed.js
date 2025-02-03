const mongoose = require('mongoose');
const { User, Location, MenuItem, Coupon, CouponRedemption, Ad, Notification } = require('./models'); // Import all models
require('dotenv').config(); // Load environment variables

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        // Ensure collections are empty before seeding
        await User.deleteMany({});
        await Location.deleteMany({});
        await MenuItem.deleteMany({});
        await Coupon.deleteMany({});
        await CouponRedemption.deleteMany({});
        await Ad.deleteMany({});
        await Notification.deleteMany({});

        console.log('🗑️ Cleared old data');

        // Create Users (Admin, Restaurant, Customer)
        const adminUser = await User.create({
            cognitoSub: "admin-123",
            username: "admin",
            email: "admin@example.com",
            role: "Admin"
        });

        const restaurantUser = await User.create({
            cognitoSub: "rest-001",
            username: "bestrestaurant",
            email: "contact@restaurant.com",
            role: "Restaurant"
        });

        const customerUser = await User.create({
            cognitoSub: "cust-001",
            username: "happycustomer",
            email: "customer@example.com",
            role: "Customer",
            favoritesLocations: []
        });

        console.log('✅ Users Created');

        // Create a Sample Location
        const location = await Location.create({
            restaurantId: restaurantUser._id,
            name: "Best Restaurant",
            address: "123 Food St, Food City",
            geolocation: { type: "Point", coordinates: [-79.3832, 43.6532] }
        });

        console.log('✅ Sample Location Created');

        // Add location to the customer's favorite locations
        customerUser.favoritesLocations.push(location._id);
        await customerUser.save();

        console.log('✅ Customer favorites updated');

        // Create a Sample Menu Item
        const menuItem = await MenuItem.create({
            locationId: location._id,
            name: "Burger",
            description: "Delicious cheeseburger with fresh ingredients.",
            price: 9.99
        });

        console.log('✅ Sample Menu Item Created');

        // Create a Sample Coupon
        const coupon = await Coupon.create({
            locationId: location._id,
            type: "BOGO",
            code: "BOGO2024",
            discountValue: 50,
            expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
            quantity: 100,
            maxUsagePerUser: 2
        });

        console.log('✅ Sample Coupon Created');

        // Create a Sample Coupon Redemption
        await CouponRedemption.create({
            couponId: coupon._id,
            userId: customerUser._id,
            locationId: location._id
        });

        console.log('✅ Sample Coupon Redemption Recorded');

        // Create a Sample Advertisement
        await Ad.create({
            locationId: location._id,
            type: "Image",
            content: "https://example.com/ad.jpg",
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
        });

        console.log('✅ Sample Advertisement Created');

        // Create a Sample Notification
        await Notification.create({
            restaurantId: restaurantUser._id,
            locationId: location._id,
            customerId: customerUser._id,
            type: "Push",
            message: "Your favorite restaurant has a new deal!",
            status: "Sent"
        });

        console.log('✅ Sample Notification Sent');

        console.log('🎉 Database seeding complete!');
        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        mongoose.connection.close();
    }
};

seedDatabase();
