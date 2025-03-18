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

    // Fetch all coupons associated with these locations and populate related fields
    const coupons = await Coupon.find({ locationId: { $in: locationIds }, isActive: true })
      .populate('purchasedItemIds', 'name') // Get item names for purchased items
      .populate('freeItemIds', 'name')      // Get item names for free items
      .populate('comboItems', 'name')       // Get item names for combo items
      .populate('familyPackItems', 'name') // ✅ Add this line
      .select(
        '_id locationId description familyPackItems familyPackPrice quantity startTime endTime startHour endHour type code comboPrice discountPercentage minimumSpend discountValue expirationDate image purchasedItemIds freeItemIds comboItems'
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
          comboPrice: coupon.comboPrice,
          min: coupon.minimumSpend,
          discountPercentage: coupon.discountPercentage,
          discountValue: coupon.discountValue,
          startTime: coupon.startTime,
          endTime: coupon.endTime,
          startHour: coupon.startHour,
          endHour: coupon.endHour,
          expirationDate: coupon.expirationDate,
          familyPackPrice: coupon.familyPackPrice,
          purchasedItems: coupon.purchasedItemIds.map(item => item.name), // List of purchased items
          freeItems: coupon.freeItemIds.map(item => item.name),           // List of free items
          comboItems: coupon.comboItems.map(item => item.name),           // List of combo items
          familyPackItems: coupon.familyPackItems.map(item => item.name), // List of family pack items          
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

    // 🔹 Create case-insensitive regex for search
    const searchRegex = new RegExp(query, "i");

    // 🔹 Fetch locations where name OR address matches, and include coupon count
    const locations = await Location.aggregate([
      {
        $match: {
          $or: [
            { name: { $regex: searchRegex } },
            { address: { $regex: searchRegex } }
          ]
        }
      },
      {
        $lookup: {
          from: "coupons",
          localField: "_id",
          foreignField: "locationId",
          as: "coupons"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          address: 1,
          logo: 1, // ✅ Ensure location image is included
          couponCount: { $size: { $filter: { input: "$coupons", as: "coupon", cond: { $eq: ["$$coupon.isActive", true] } } } },
          hours: 1
        }
      }
    ]);

    if (!locations.length) {
      return res.status(404).json({ message: "No matching locations found" });
    }

    // Format response
    const formattedLocations = locations.map(location => ({
      locationId: location._id,
      locationName: location.name,
      address: location.address,
      image: location.logo || "https://via.placeholder.com/100", // ✅ Fallback image if missing
      couponCount: location.couponCount || 0, // ✅ Accurate coupon count
      hours: location.hours || "No hours available"
    }));

    return res.json({ query, results: formattedLocations });
  } catch (error) {
    console.error("Error searching locations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = { getDealsByCityAndCountry, getLocationsByCityAndCountry, searchLocations };
