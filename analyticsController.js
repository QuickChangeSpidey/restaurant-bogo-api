const {CouponRedemption} =  require('./models');

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

module.exports = {getCouponUsageSummary, getRedemptionsByDate, getRedemptionsByUser}