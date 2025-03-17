const { Location, Coupon } = require('./models');
const moment = require('moment-timezone');

/**
 * Fetch all deal types for a given city and country (filtered from address string).
 */
const getDealsByCityAndCountry = async (req, res) => {
  try {
    const { city, country } = req.params;

    // Create regex patterns to match city & country within the address string
    const cityRegex = new RegExp(`(^|,\\s*)${city}(,|$|\\s)`, 'i');
    const countryRegex = new RegExp(`(^|,\\s*)${country}(,|$|\\s)`, 'i');

    // Fetch all locations where address contains both city and country
    const locations = await Location.find({
      address: { $regex: cityRegex },
      address: { $regex: countryRegex },
    }).select('_id name address');

    if (!locations.length) {
      return res.status(404).json({ message: 'No locations found in this city and country' });
    }

    // Extract location IDs
    const locationIds = locations.map(loc => loc._id);

    // Fetch all coupons associated with these locations
    const coupons = await Coupon.find({ locationId: { $in: locationIds }, isActive: true }).select(
      '_id locationId quantity type code discountPercentage discountValue expirationDate image'
    ); // Select only necessary fields

    // Coupon type categories
    const couponTypes = [
      'BOGO', 'Buy1Get1FreeItem', 'StorewideFlatDiscount', 'DiscountOnSpecificItems', 'SpendMoreSaveMore',
      'FreeItemWithPurchase', 'HappyHour', 'ComboDeal', 'FamilyPack', 'LimitedTime'
    ];

    // Organize deals by type
    const dealsByType = {};
    couponTypes.forEach(type => {
      dealsByType[type] = [];
    });

    coupons.forEach(coupon => {
      const location = locations.find(loc => loc._id.toString() === coupon.locationId.toString());

      if (dealsByType[coupon.type]) {
        dealsByType[coupon.type].push({
          locationId: coupon.locationId,
          locationName: location?.name || 'Unknown Location',
          image: coupon.image, // ✅ Use coupon image instead of location logo
          address: location?.address || 'Unknown Address',
          couponId: coupon._id,
          quantity: coupon.quantity,
          type: coupon.type,
          code: coupon.code,
          discountPercentage: coupon.discountPercentage,
          discountValue: coupon.discountValue,
          expirationDate: coupon.expirationDate,
        });
      }
    });

    return res.json({ city, country, deals: dealsByType });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Fetch locations in a city and country, including the number of available coupons and current day's hours.
 */
const getLocationsByCityAndCountry = async (req, res) => {
  try {
    const { city, country } = req.params;

    // Validate City & Country before regex
    if (!city || !country) {
      return res.status(400).json({ message: 'City and country are required' });
    }

    // 🔹 Timezone Handling: Use a predefined mapping instead of `${country}/${city}`
    const timezoneMapping = {
      "Vancouver": "America/Vancouver",
      "Toronto": "America/Toronto",
      "New York": "America/New_York",
      "London": "Europe/London"
    };
    const timezone = timezoneMapping[city] || "UTC"; // Default to UTC if unknown
    const today = moment().tz(timezone).format('dddd'); // Get current day in local timezone

    // 🔹 Use `$and` to ensure both city & country exist in the same address field
    const locations = await Location.find({
      $and: [
        { address: { $regex: new RegExp(`(^|,\\s*)${city}(,|$|\\s)`, 'i') } },
        { address: { $regex: new RegExp(`(^|,\\s*)${country}(,|$|\\s)`, 'i') } }
      ]
    }).select('_id name address hours');

    if (!locations.length) {
      return res.status(404).json({ message: 'No locations found in this city and country' });
    }

    // Extract location IDs
    const locationIds = locations.map(loc => loc._id);

    // 🔹 Count available coupons per location
    const coupons = await Coupon.aggregate([
      { $match: { locationId: { $in: locationIds }, isActive: true } },
      { $group: { _id: '$locationId', totalCoupons: { $sum: '$quantity' } } }
    ]);

    // 🔹 Convert coupon counts into a Map for quick lookup
    const couponCountMap = {};
    coupons.forEach(coupon => {
      couponCountMap[coupon._id.toString()] = coupon.totalCoupons;
    });

    // 🔹 Format location data with available coupons and today's hours
    const formattedLocations = locations.map(location => ({
      locationId: location._id,
      locationName: location.name,
      address: location.address,
      availableCoupons: couponCountMap[location._id.toString()] || 0, // Default to 0 if no coupons
      hoursToday: location.hours?.[today] || 'Closed' // Fix: Ensure we're using `businessHours`
    }));

    return res.json({ city, country, locations: formattedLocations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const searchLocations = async (req, res) => {
  try {
    const { query } = req.params;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    // 🔹 Create case-insensitive regex
    const searchRegex = new RegExp(query, "i");

    // 🔹 Find locations where name OR address matches
    const locations = await Location.find({
      $or: [
        { name: { $regex: searchRegex } },
        { address: { $regex: searchRegex } }
      ]
    }).select("_id name address hours image");

    if (!locations.length) {
      return res.status(404).json({ message: "No matching locations found" });
    }

    // 🔹 Format response
    const formattedLocations = locations.map(location => ({
      locationId: location._id,
      locationName: location.name,
      address: location.address,
      businessHours: location.businessHours || "No hours available"
    }));

    return res.json({ query, results: formattedLocations });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
} ;

module.exports = { getDealsByCityAndCountry, getLocationsByCityAndCountry, searchLocations };
