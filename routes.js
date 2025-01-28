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
    getCouponsByLocationId
} = require('./restaurantController');

const router = express.Router();

// Restaurant Routes
router.post('/locations', checkAuth, checkRole('Restaurant'), addLocation);
router.put('/locations/:id', checkAuth, checkRole('Restaurant'), updateLocation);
router.delete('/locations/:id', checkAuth, checkRole('Restaurant'), deleteLocation);

router.post('/menu-items', checkAuth, checkRole('Restaurant'), addMenuItem);
router.put('/menu-items/:id', checkAuth, checkRole('Restaurant'), updateMenuItem);
router.delete('/menu-items/:id', checkAuth, checkRole('Restaurant'), deleteMenuItem);

router.post('/coupons', checkAuth, checkRole('Restaurant'), generateCoupon);
router.put('/coupons/:id', checkAuth, checkRole('Restaurant'), updateCoupon);
router.delete('/coupons/:id', checkAuth, checkRole('Restaurant'), deleteCoupon);
router.patch('/coupons/:id/activate', checkAuth, checkRole('Restaurant'), activateCoupon);
router.patch('/coupons/:id/deactivate', checkAuth, checkRole('Restaurant'), deactivateCoupon);
router.get('/coupons/:locationId', getCouponsByLocationId);

router.post('/ads', checkAuth, checkRole('Restaurant'), addAd);
router.put('/ads/:id', checkAuth, checkRole('Restaurant'), updateAd);
router.delete('/ads/:id', checkAuth, checkRole('Restaurant'), deleteAd);

router.post('/notifications', checkAuth, checkRole('Restaurant'), sendNotifications);

router.put('/account', checkAuth, checkRole('Restaurant'), updateRestaurantDetails);

router.post('/customers', checkAuth, checkRole('Restaurant'), storeCustomerInfo);
router.put('/customers/:id', checkAuth, checkRole('Restaurant'), updateCustomerInfo);
router.delete('/customers/:id', checkAuth, checkRole('Restaurant'), deleteCustomerInfo);

module.exports = router;
