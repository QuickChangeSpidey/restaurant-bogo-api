const { Location, Coupon } = require('./models'); // Ensure correct path

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
    }).select('_id name logo address');

    if (!locations.length) {
      return res.status(404).json({ message: 'No locations found in this city and country' });
    }

    // Extract location IDs
    const locationIds = locations.map(loc => loc._id);

    // Fetch all coupons associated with these locations
    const coupons = await Coupon.find({ locationId: { $in: locationIds }, isActive: true });

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
      if (dealsByType[coupon.type]) {
        dealsByType[coupon.type].push({
          locationId: coupon.locationId,
          locationName: locations.find(loc => loc._id.toString() === coupon.locationId.toString())?.name,
          image: locations.find(loc => loc._id.toString() === coupon.locationId.toString())?.logo,
          address: locations.find(loc => loc._id.toString() === coupon.locationId.toString())?.address,
          couponId: coupon._id,
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

module.exports = { getDealsByCityAndCountry };
