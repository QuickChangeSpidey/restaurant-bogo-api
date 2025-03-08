const express = require('express');
const { checkAuth, checkRole, secureInternal } = require('./auth');
const {
  addLocation,
  updateLocation,
  deleteLocation,
  getLocation,
  getLocationsByRestaurant,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemByLocation,
  getMenuItemsByLocation,
  generateCoupon,
  updateCoupon,
  deleteCoupon,
  activateCoupon,
  deactivateCoupon,
  getCouponsByLocationId,
  getCouponAtLocation,
  getLocationsWithCoupons,
  addAd,
  updateAd,
  deleteAd,
  sendNotifications,
  updateRestaurantDetails,
  storeCustomerInfo,
  generateQR,
  updateCustomerInfo,
  deleteCustomerInfo,
  addLocationToFavorites,
  removeLocationFromFavorites,
  getFavoriteLocations,
  redeemCoupon,
  getCouponsUsedByCustomerAtLocation,
  getRedeemingCustomersByLocation,
  linkUser
} = require('./restaurantController');

const {
  getRedemptionsByDate,
  getCouponUsageSummary,
  getRedemptionsByUser,
  getTopCustomers,
  getTopRedeemedCoupons,
  getCouponUsageByLocation,
  getDailyRedemptions,
  getRedemptionsByCouponType,
} = require('./analyticsController.js');

const { uploadLocationImage, uploadMenuItemImage, uploadCouponImage } = require('./image-upload');


const router = express.Router();


// Route to upload location image
router.post('/api/location/:locationId/upload', uploadLocationImage);

// Route to upload menu item image
router.post('/api/menu-item/:menuItemId/upload', uploadMenuItemImage);

// Route to upload coupon image
router.post('/api/coupon/:couponId/upload', uploadCouponImage);


/**
 * @openapi
 * /api/locations/{locationId}/menu-items:
 *   get:
 *     tags:
 *       - Menu Items
 *     summary: Get all menu items for a location
 *     description: Retrieves all menu items associated with the specified location.
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         description: The ID of the location.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of menu items
 *       404:
 *         description: Location or menu items not found
 */
router.get(
  '/api/locations/:locationId/menu-items',
  checkAuth,
  getMenuItemsByLocation
);

/**
 * @openapi
 * /api/locations/{locationId}/menu-items/{menuItemId}:
 *   get:
 *     tags:
 *       - Menu Items
 *     summary: Get a specific menu item for a location
 *     description: Retrieves a specific menu item by its ID for the given location.
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         description: The ID of the location.
 *         schema:
 *           type: string
 *       - name: menuItemId
 *         in: path
 *         required: true
 *         description: The ID of the menu item.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu item details retrieved successfully
 *       404:
 *         description: Menu item not found for this location
 */
router.get(
  '/api/locations/:locationId/menu-items/:menuItemId',
  checkAuth,
  getMenuItemByLocation
);


/**
 * @openapi
 * /api/restaurant/locations:
 *   get:
 *     tags:
 *       - Locations
 *     summary: Get all locations for the restaurant
 *     description: Retrieves all locations belonging to the authenticated restaurant.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of locations
 *       401:
 *         description: Unauthorized
 */
router.get('/api/restaurant/locations', checkAuth, checkRole('Restaurant', 'Admin'), getLocationsByRestaurant);

/**
 * @openapi
 * /api/locations/{id}:
 *   get:
 *     tags:
 *       - Locations
 *     summary: Get a specific location by ID
 *     description: Retrieves a specific location by its ID.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Location ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Location details retrieved successfully
 *       404:
 *         description: Location not found
 */
router.get('/api/locations/:id', checkAuth, checkRole('Restaurant', 'Admin'), getLocation);


/**
 * @openapi
 * /locations/{locationId}/coupons/{couponId}:
 *   get:
 *     tags:
 *       - Coupons
 *     summary: Get a specific coupon at a location
 *     description: Retrieve a coupon by its ID for the specified location.
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         description: The ID of the location.
 *         schema:
 *           type: string
 *       - name: couponId
 *         in: path
 *         required: true
 *         description: The ID of the coupon.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon retrieved successfully
 *       404:
 *         description: Location or coupon not found
 */
router.get('/api/locations/:locationId/coupons/:couponId', getCouponAtLocation);


/**
 * @openapi
 * /locations:
 *   post:
 *     tags:
 *       - Locations
 *     summary: Add a new location
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *             required:
 *               - name
 *               - address
 *     responses:
 *       201:
 *         description: Location created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/api/locations', checkAuth, checkRole('Restaurant', 'Admin'), addLocation);

/**
 * @openapi
 * /locations/{id}:
 *   put:
 *     tags:
 *       - Locations
 *     summary: Update an existing location
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Location ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/api/locations/:id', checkAuth, checkRole('Restaurant', 'Admin'), updateLocation);

/**
 * @openapi
 * /locations/{id}:
 *   delete:
 *     tags:
 *       - Locations
 *     summary: Delete a location
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Location ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Location deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/api/locations/:id', checkAuth, checkRole('Restaurant', 'Admin'), deleteLocation);

/**
 * @openapi
 * /locations-with-coupons:
 *   get:
 *     tags:
 *       - Locations
 *     summary: Get all locations with coupons
 *     responses:
 *       200:
 *         description: Returns a list of locations along with coupon data
 */
router.get('/api/locations-with-coupons', getLocationsWithCoupons);

/**
 * @openapi
 * /menu-items:
 *   post:
 *     tags:
 *       - Menu Items
 *     summary: Add a new menu item
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *             required:
 *               - name
 *               - price
 *     responses:
 *       201:
 *         description: Menu item created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/api/menu-items', checkAuth, checkRole('Restaurant', 'Admin'), addMenuItem);

/**
 * @openapi
 * /menu-items/{id}:
 *   put:
 *     tags:
 *       - Menu Items
 *     summary: Update a menu item
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Menu item ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu item updated
 */
router.put('/api/menu-items/:id', checkAuth, checkRole('Restaurant', 'Admin'), updateMenuItem);

/**
 * @openapi
 * /menu-items/{id}:
 *   delete:
 *     tags:
 *       - Menu Items
 *     summary: Delete a menu item
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Menu item ID
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Menu item deleted
 */
router.delete('/api/menu-items/:id', checkAuth, checkRole('Restaurant', 'Admin'), deleteMenuItem);

/**
 * @openapi
 * /coupons:
 *   post:
 *     tags:
 *       - Coupons
 *     summary: Generate a new coupon
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               discountType:
 *                 type: string
 *               discountValue:
 *                 type: number
 *               expirationDate:
 *                 type: string
 *     responses:
 *       201:
 *         description: Coupon created
 */
router.post('/api/coupons', checkAuth, checkRole('Restaurant', 'Admin'), generateCoupon);

/**
 * @openapi
 * /coupons/{id}:
 *   put:
 *     tags:
 *       - Coupons
 *     summary: Update an existing coupon
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Coupon ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon updated
 */
router.put('/api/coupons/:id', checkAuth, checkRole('Restaurant', 'Admin'), updateCoupon);

/**
 * @openapi
 * /coupons/{id}:
 *   delete:
 *     tags:
 *       - Coupons
 *     summary: Delete a coupon
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Coupon ID
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Coupon deleted
 */
router.delete('/api/coupons/:id', checkAuth, checkRole('Restaurant', 'Admin'), deleteCoupon);

/**
 * @openapi
 * /coupons/{id}/activate:
 *   patch:
 *     tags:
 *       - Coupons
 *     summary: Activate a coupon
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Coupon ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon activated
 */
router.patch('/api/coupons/:id/activate', checkAuth, checkRole('Restaurant', 'Admin'), activateCoupon);

/**
 * @openapi
 * /coupons/{id}/deactivate:
 *   patch:
 *     tags:
 *       - Coupons
 *     summary: Deactivate a coupon
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Coupon ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon deactivated
 */
router.patch('/api/coupons/:id/deactivate', checkAuth, checkRole('Restaurant', 'Admin'), deactivateCoupon);

/**
 * @openapi
 * /coupons/{locationId}:
 *   get:
 *     tags:
 *       - Coupons
 *     summary: Get coupons by location ID
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         description: Location ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns coupons for the specified location
 */
router.get('/api/coupons/:locationId', getCouponsByLocationId);

/**
 * @openapi
 * /coupons/redeem:
 *   post:
 *     tags:
 *       - Coupons
 *     summary: Redeem a coupon
 *     description: Requires Customer, Restaurant, or Admin role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               couponId:
 *                 type: string
 *               locationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon redeemed successfully
 */
router.post('/api/coupons/redeem', checkAuth, checkRole('Customer', 'Restaurant', 'Admin'), redeemCoupon);

/**
 * @openapi
 * /locations/{locationId}/redeeming-customers:
 *   get:
 *     tags:
 *       - Coupons
 *     summary: Get a list of distinct customers who have redeemed coupons at a specific location
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         description: The ID of the location
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of customer IDs or profiles
 */
router.get(
  '/api/locations/:locationId/redeeming-customers',
  checkAuth,
  checkRole('Restaurant', 'Admin'),
  getRedeemingCustomersByLocation
);

/**
 * @openapi
 * /locations/{locationId}/customers/{customerId}/coupons-used:
 *   get:
 *     tags:
 *       - Coupons
 *     summary: Get coupons used by a particular customer at a location
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *       - name: customerId
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: List of coupons redeemed by the given customer at the specified location
 */
router.get(
  '/api/locations/:locationId/customers/:customerId/coupons-used',
  checkAuth,
  checkRole('Restaurant', 'Admin'),
  getCouponsUsedByCustomerAtLocation
);

/**
 * @openapi
 * /ads:
 *   post:
 *     tags:
 *       - Ads
 *     summary: Create a new ad
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Ad created
 */
router.post('/api/ads', checkAuth, checkRole('Restaurant', 'Admin'), addAd);

/**
 * @openapi
 * /ads/{id}:
 *   put:
 *     tags:
 *       - Ads
 *     summary: Update an ad
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Ad ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ad updated
 */
router.put('/api/ads/:id', checkAuth, checkRole('Restaurant', 'Admin'), updateAd);

/**
 * @openapi
 * /ads/{id}:
 *   delete:
 *     tags:
 *       - Ads
 *     summary: Delete an ad
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Ad ID
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Ad deleted
 */
router.delete('/api/ads/:id', checkAuth, checkRole('Restaurant', 'Admin'), deleteAd);

/**
 * @openapi
 * /notifications:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Send notifications
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications sent
 */
router.post('/api/notifications', checkAuth, checkRole('Restaurant', 'Admin'), sendNotifications);

/**
 * @openapi
 * /account:
 *   put:
 *     tags:
 *       - Restaurant
 *     summary: Update restaurant details
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account updated
 */
router.put('/api/account', checkAuth, checkRole('Restaurant', 'Admin'), updateRestaurantDetails);

/**
 * @openapi
 * /customers:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Store new customer info
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Customer info stored
 */
router.post('/api/customers', checkAuth, checkRole('Restaurant', 'Admin'), storeCustomerInfo);

/**
 * @openapi
 * /customers/{id}:
 *   put:
 *     tags:
 *       - Customers
 *     summary: Update customer info
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Customer ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer info updated
 */
router.put('/api/customers/:id', checkAuth, checkRole('Restaurant', 'Admin'), updateCustomerInfo);

/**
 * @openapi
 * /customers/{id}:
 *   delete:
 *     tags:
 *       - Customers
 *     summary: Delete customer info
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Customer ID
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Customer info deleted
 */
router.delete('/api/customers/:id', checkAuth, checkRole('Restaurant', 'Admin'), deleteCustomerInfo);

/**
 * @openapi
 * /favorites/locations/{locationId}:
 *   post:
 *     tags:
 *       - Favorites
 *     summary: Add a location to favorites
 *     description: Requires Customer role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         description: Location ID
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Location added to favorites
 */
router.post('/api/favorites/locations/:locationId', checkAuth, checkRole('Customer'), addLocationToFavorites);

/**
 * @openapi
 * /favorites/locations/{locationId}:
 *   delete:
 *     tags:
 *       - Favorites
 *     summary: Remove a location from favorites
 *     description: Requires Customer role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: locationId
 *         in: path
 *         required: true
 *         description: Location ID
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Location removed from favorites
 */
router.delete('/api/favorites/locations/:locationId', checkAuth, checkRole('Customer'), removeLocationFromFavorites);

/**
 * @openapi
 * /favorites/locations:
 *   get:
 *     tags:
 *       - Favorites
 *     summary: Get all favorite locations
 *     description: Requires Customer role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite locations
 */
router.get('/api/favorites/locations', checkAuth, checkRole('Customer'), getFavoriteLocations);

/* ======================
   ANALYTICS ROUTES
   ====================== */

/**
 * @openapi
 * /analytics/redemptions/date-range:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get redemptions by date range
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: start
 *         in: query
 *         required: false
 *         description: Start date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *       - name: end
 *         in: query
 *         required: false
 *         description: End date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns coupon redemptions in the specified date range
 */
router.get('/api/analytics/redemptions/date-range', checkAuth, checkRole('Restaurant', 'Admin'), getRedemptionsByDate);

/**
 * @openapi
 * /analytics/redemptions/summary:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get overall coupon usage summary
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Summary of coupon usage
 */
router.get('/api/analytics/redemptions/summary', checkAuth, checkRole('Restaurant', 'Admin'), getCouponUsageSummary);

/**
 * @openapi
 * /analytics/redemptions/user/{userId}:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get redemptions by user
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Redemptions for the specified user
 */
router.get('/api/analytics/redemptions/user/:userId', checkAuth, checkRole('Restaurant', 'Admin'), getRedemptionsByUser);

/**
 * @openapi
 * /analytics/customers/top:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get top customers by redemption count
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of top customers
 */
router.get('/api/analytics/customers/top', checkAuth, checkRole('Restaurant', 'Admin'), getTopCustomers);

/**
 * @openapi
 * /analytics/coupons/top-redeemed:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get top redeemed coupons
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Coupons in descending order of redemption count
 */
router.get('/api/analytics/coupons/top-redeemed', checkAuth, checkRole('Restaurant', 'Admin'), getTopRedeemedCoupons);

/**
 * @openapi
 * /analytics/locations/usage:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get coupon usage by location
 *     description: If locationId is omitted, returns usage for all locations. Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: locationId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon usage stats
 */
router.get('/api/analytics/locations/usage', checkAuth, checkRole('Restaurant', 'Admin'), getCouponUsageByLocation);

/**
 * @openapi
 * /analytics/redemptions/daily:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get daily redemptions breakdown
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: start
 *         in: query
 *         required: false
 *         description: Start date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *       - name: end
 *         in: query
 *         required: false
 *         description: End date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Daily redemptions in the given date range
 */
router.get('/api/analytics/redemptions/daily', checkAuth, checkRole('Restaurant', 'Admin'), getDailyRedemptions);

/**
 * @openapi
 * /analytics/coupons/types:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get redemptions grouped by coupon type
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Redemption counts by coupon type
 */
router.get('/api/analytics/coupons/types', checkAuth, checkRole('Restaurant', 'Admin'), getRedemptionsByCouponType);

router.post('/api/internal-users', secureInternal, linkUser)

/**
 * @openapi
 * /locations/:id/generate-qr:
 *   post:
 *     tags:
 *       - QR generation
 *     summary: Post call to generate coupon code.
 *     description: Requires Restaurant or Admin role.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Redemption counts by coupon type
 */
router.post('/api/locations/:id/generate-qr', checkAuth, checkRole('Restaurant', 'Admin'), generateQR);

module.exports = router;
