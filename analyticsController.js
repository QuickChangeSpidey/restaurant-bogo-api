const { CouponRedemption } = require('./models');

const getRedemptionsByDate = async (req, res, next) => {
  try {
    // Use query params, e.g. ?start=2025-01-01&end=2025-01-31
    const { start, end } = req.query;

    // Convert to Date objects
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Find redemptions that occurred in this date range
    const redemptions = await CouponRedemption.find({
      redeemedAt: { $gte: startDate, $lte: endDate },
    }).populate('couponId userId locationId');

    res.status(200).json(redemptions);
  } catch (err) {
    next(err);
  }
};

// Summaries of coupon usage
const getCouponUsageSummary = async (req, res, next) => {
  try {
    const result = await CouponRedemption.aggregate([
      {
        $group: {
          _id: '$couponId',
          totalRedemptions: { $sum: 1 },
        }
      },
      {
        $sort: { totalRedemptions: -1 }
      }
    ]);

    // If you want to populate the coupon details, you can do a $lookup or handle it afterwards
    // For a simpler approach, do a separate lookup or run .populate() after the aggregation if needed.

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


const getRedemptionsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const redemptions = await CouponRedemption.find({ userId })
      .populate('couponId locationId')
      .exec();

    res.status(200).json(redemptions);
  } catch (err) {
    next(err);
  }
};

const getTopRedeemedCoupons = async (req, res, next) => {
  try {
    // Optional: filter by date range or by location if needed
    const { start, end } = req.query || {};

    // Build a dynamic match stage if date range is provided
    const matchStage = {};
    if (start && end) {
      matchStage.redeemedAt = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const pipeline = [
      { $match: matchStage },
      // Group by couponId, count how many times each coupon was redeemed
      {
        $group: {
          _id: '$couponId',
          totalRedemptions: { $sum: 1 },
        },
      },
      // Sort in descending order by totalRedemptions
      { $sort: { totalRedemptions: -1 } },
      // (Optional) limit to top N
      { $limit: 10 },
      // Lookup coupon details
      {
        $lookup: {
          from: 'coupons',
          localField: '_id',
          foreignField: '_id',
          as: 'couponInfo',
        },
      },
      // Unwind to transform couponInfo array into a single object
      { $unwind: '$couponInfo' },
      // Project final fields
      {
        $project: {
          _id: 1,
          totalRedemptions: 1,
          'couponInfo.type': 1,
          'couponInfo.code': 1,
          'couponInfo.locationId': 1,
        },
      },
    ];

    const result = await CouponRedemption.aggregate(pipeline);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getCouponUsageByLocation = async (req, res, next) => {
  try {
    // If a specific location is provided
    const { locationId } = req.params;

    const matchStage = {};
    if (locationId) {
      matchStage.locationId = new mongoose.Types.ObjectId(locationId);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$locationId',
          totalRedemptions: { $sum: 1 },
        },
      },
      // Sort by redemption count
      { $sort: { totalRedemptions: -1 } },
      // (Optional) limit to top N locations
      {
        $lookup: {
          from: 'locations',
          localField: '_id',
          foreignField: '_id',
          as: 'locationInfo',
        },
      },
      { $unwind: '$locationInfo' },
      {
        $project: {
          _id: 1,
          totalRedemptions: 1,
          'locationInfo.name': 1,
          'locationInfo.address': 1,
          'locationInfo.restaurantId': 1,
        },
      },
    ];

    const result = await CouponRedemption.aggregate(pipeline);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


const getDailyRedemptions = async (req, res, next) => {
  try {
    // Optional date range
    const { start, end } = req.query;

    const matchStage = {};
    if (start && end) {
      matchStage.redeemedAt = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const pipeline = [
      { $match: matchStage },
      // Create a "date" field truncated to day
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$redeemedAt' }
          },
          totalRedemptions: { $sum: 1 }
        },
      },
      { $sort: { '_id': 1 } }, // ascending date
    ];

    const result = await CouponRedemption.aggregate(pipeline);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getRedemptionsByCouponType = async (req, res, next) => {
  try {
    const pipeline = [
      // 1) Join the coupon to get its type
      {
        $lookup: {
          from: 'coupons',
          localField: 'couponId',
          foreignField: '_id',
          as: 'couponData',
        },
      },
      { $unwind: '$couponData' },

      // 2) Group by couponData.type
      {
        $group: {
          _id: '$couponData.type',
          totalRedemptions: { $sum: 1 },
        },
      },
      // 3) Sort descending
      { $sort: { totalRedemptions: -1 } },
    ];

    const result = await CouponRedemption.aggregate(pipeline);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getTopCustomers = async (req, res, next) => {
  try {
    const pipeline = [
      // Group by userId
      {
        $group: {
          _id: '$userId',
          totalRedemptions: { $sum: 1 },
        },
      },
      { $sort: { totalRedemptions: -1 } },
      { $limit: 10 }, // top 10 customers
      // Lookup user data (e.g., username, email)
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 1,
          totalRedemptions: 1,
          'userInfo.username': 1,
          'userInfo.email': 1,
          'userInfo.role': 1,
        },
      },
    ];

    const result = await CouponRedemption.aggregate(pipeline);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};



module.exports = { 
  getCouponUsageSummary, 
  getRedemptionsByDate, 
  getRedemptionsByUser, 
  getTopRedeemedCoupons, 
  getCouponUsageByLocation, 
  getDailyRedemptions, 
  getRedemptionsByCouponType,
  getTopCustomers
}