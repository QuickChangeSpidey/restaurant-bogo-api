const express = require('express');
const { checkAuth, checkRole } = require('./auth');
const {
  addLocation,
  updateLocation,
  deleteLocation,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  generateCoupon,
  updateCoupon,
  deleteCoupon,
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
  getCouponsByLocationId,
  getLocationsWithCoupons,
  addLocationToFavorites,
  removeLocationFromFavorites,
  getFavoriteLocations,
  redeemCoupon,
  getCouponsUsedByCustomerAtLocation,
  getRedeemingCustomersByLocation
} = require('./restaurantController');

const {
  getRedemptionsByDate,       // Aggregates coupon redemptions over a specified date range
  getCouponUsageSummary,      // Summarizes total redemptions (e.g., grouped by coupon)
  getRedemptionsByUser,       // Retrieves coupon redemptions for a specific user
  getTopCustomers,            // Finds which customers redeem the most coupons
  getTopRedeemedCoupons,      // Lists coupons in descending order of total redemptions
  getCouponUsageByLocation,   // Shows how many coupon redemptions occurred per location
  getDailyRedemptions,        // Returns a daily breakdown of redemptions (useful for charts)
  getRedemptionsByCouponType, // Shows redemption counts grouped by coupon type (BOGO, FlatDiscount, etc.)
} = require('./analyticsController.js');

const router = express.Router();

// Restaurant Routes
router.post('/locations', checkAuth, checkRole('Restaurant','Admin'), addLocation);
router.put('/locations/:id', checkAuth, checkRole('Restaurant', 'Admin'), updateLocation);
router.delete('/locations/:id', checkAuth, checkRole('Restaurant', 'Admin'), deleteLocation);
router.get('/locations-with-coupons', getLocationsWithCoupons);

router.post('/menu-items', checkAuth, checkRole('Restaurant', 'Admin'), addMenuItem);
router.put('/menu-items/:id', checkAuth, checkRole('Restaurant', 'Admin'), updateMenuItem);
router.delete('/menu-items/:id', checkAuth, checkRole('Restaurant', 'Admin'), deleteMenuItem);

router.post('/coupons', checkAuth, checkRole('Restaurant', 'Admin'), generateCoupon);
router.put('/coupons/:id', checkAuth, checkRole('Restaurant', 'Admin'), updateCoupon);
router.delete('/coupons/:id', checkAuth, checkRole('Restaurant', 'Admin'), deleteCoupon);
router.patch('/coupons/:id/activate', checkAuth, checkRole('Restaurant', 'Admin'), activateCoupon);
router.patch('/coupons/:id/deactivate', checkAuth, checkRole('Restaurant', 'Admin'), deactivateCoupon);
router.get('/coupons/:locationId', getCouponsByLocationId);
router.post('/coupons/redeem', checkAuth, checkRole('Customer','Restaurant','Admin'), redeemCoupon);
/**
 * Get a list of distinct customers who have redeemed coupons at a specific location.
 * Example: GET /locations/<LOCATION_ID>/redeeming-customers
 */
router.get(
  '/locations/:locationId/redeeming-customers',
  checkAuth,
  checkRole('Restaurant', 'Admin'),  // Only Restaurant or Admin can access
  getRedeemingCustomersByLocation   // Controller function
);
router.get(
  '/locations/:locationId/customers/:customerId/coupons-used',
  checkAuth,
  checkRole('Restaurant', 'Admin'),
  getCouponsUsedByCustomerAtLocation
);

router.post('/ads', checkAuth, checkRole('Restaurant', 'Admin'), addAd);
router.put('/ads/:id', checkAuth, checkRole('Restaurant', 'Admin'), updateAd);
router.delete('/ads/:id', checkAuth, checkRole('Restaurant', 'Admin'), deleteAd);

router.post('/notifications', checkAuth, checkRole('Restaurant', 'Admin'), sendNotifications);

router.put('/account', checkAuth, checkRole('Restaurant', 'Admin'), updateRestaurantDetails);

router.post('/customers', checkAuth, checkRole('Restaurant', 'Admin'), storeCustomerInfo);
router.put('/customers/:id', checkAuth, checkRole('Restaurant', 'Admin'), updateCustomerInfo);
router.delete('/customers/:id', checkAuth, checkRole('Restaurant', 'Admin'), deleteCustomerInfo);

router.post('/favorites/locations/:locationId', checkAuth, checkRole('Customer'), addLocationToFavorites);
router.delete('/favorites/locations/:locationId', checkAuth, checkRole('Customer'), removeLocationFromFavorites);
router.get('/favorites/locations', checkAuth, checkRole('Customer'), getFavoriteLocations);

/**
 * ANALYTICS ROUTES
 */

// 1) Get redemptions by date range
// Example usage: GET /analytics/redemptions/date-range?start=2025-01-01&end=2025-01-31
router.get(
  '/analytics/redemptions/date-range',
  checkAuth,
  checkRole('Restaurant', 'Admin'), // or 'Admin' if needed
  getRedemptionsByDate
);

// 2) Get overall coupon usage summary (e.g., total redemptions by coupon, etc.)
router.get(
  '/analytics/redemptions/summary',
  checkAuth,
  checkRole('Restaurant', 'Admin'), // or 'Admin'
  getCouponUsageSummary
);

// 3) Get redemptions by user
// Example usage: GET /analytics/redemptions/user/<USER_ID>
router.get(
  '/analytics/redemptions/user/:userId',
  checkAuth,
  checkRole('Restaurant', 'Admin'), // or 'Admin'
  getRedemptionsByUser
);

// 4) Get top customers (those who redeem the most coupons)
// Example usage: GET /analytics/customers/top
router.get(
  '/analytics/customers/top',
  checkAuth,
  checkRole('Restaurant', 'Admin'), // or 'Admin'
  getTopCustomers
);

// 5) Get top redeemed coupons (by total redemption count)
// Example usage: GET /analytics/coupons/top-redeemed
router.get(
  '/analytics/coupons/top-redeemed',
  checkAuth,
  checkRole('Restaurant', 'Admin'), // or 'Admin'
  getTopRedeemedCoupons
);

// 6) Get coupon usage by location
// Example usage: GET /analytics/locations/usage?locationId=<LOCATION_ID>
// If no locationId is provided, returns usage for all locations
router.get(
  '/analytics/locations/usage',
  checkAuth,
  checkRole('Restaurant', 'Admin'), // or 'Admin'
  getCouponUsageByLocation
);

// 7) Get daily redemptions (time-based breakdown)
// Example usage: GET /analytics/redemptions/daily?start=2025-01-01&end=2025-01-31
router.get(
  '/analytics/redemptions/daily',
  checkAuth,
  checkRole('Restaurant', 'Admin'), // or 'Admin'
  getDailyRedemptions
);

// 8) Get redemptions by coupon type (e.g., BOGO, FlatDiscount, FamilyPack, etc.)
// Example usage: GET /analytics/coupons/types
router.get(
  '/analytics/coupons/types',
  checkAuth,
  checkRole('Restaurant', 'Admin'), // or 'Admin'
  getRedemptionsByCouponType
);


module.exports = router;
