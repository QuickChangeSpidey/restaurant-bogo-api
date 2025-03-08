const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('./aws-config');  // The AWS S3 setup from earlier
const Location = require('./models').Location; // Your Location model
const MenuItem = require('./models').MenuItem; // Your MenuItem model
const Coupon = require('./models').Coupon; // Your Coupon model

// Set up Multer to store files in S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,  // Your S3 bucket name from .env
    acl: 'public-read',  // Public read access for the uploaded image
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      // Separate folders for each resource type (Location, MenuItem, Coupon)
      const fileExtension = file.originalname.split('.').pop();
      let folder;

      // Check the resource type and set the folder accordingly
      if (req.params.locationId) {
        folder = `locations/${req.params.locationId}`;
      } else if (req.params.menuItemId) {
        folder = `menu-items/${req.params.menuItemId}`;
      } else if (req.params.couponId) {
        folder = `coupons/${req.params.couponId}`;
      } else {
        return cb(new Error('No valid resource found'));
      }

      // Set the file path with the folder, timestamp, and file name
      const fileName = `${Date.now()}.${fileExtension}`;
      cb(null, `${folder}/${fileName}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB size limit
}).single('image'); // 'image' is the field name in your form

// API route for Location Image Upload
const uploadLocationImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      // Save the S3 URL to the location's logo field
      const location = await Location.findByIdAndUpdate(
        req.params.locationId,
        { logo: req.file.location },  // S3 URL
        { new: true }
      );
      res.status(200).json(location);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update location' });
    }
  });
};

// API route for Menu Item Image Upload
const uploadMenuItemImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      // Save the S3 URL to the menu item's image field
      const menuItem = await MenuItem.findByIdAndUpdate(
        req.params.menuItemId,
        { image: req.file.location },  // S3 URL
        { new: true }
      );
      res.status(200).json(menuItem);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  });
};

// API route for Coupon Image Upload
const uploadCouponImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      // Save the S3 URL to the coupon's image field
      const coupon = await Coupon.findByIdAndUpdate(
        req.params.couponId,
        { image: req.file.location },  // S3 URL
        { new: true }
      );
      res.status(200).json(coupon);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update coupon' });
    }
  });
};

module.exports = {
  uploadLocationImage,
  uploadMenuItemImage,
  uploadCouponImage,
};
