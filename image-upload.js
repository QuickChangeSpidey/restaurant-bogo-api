const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({ region: process.env.AWS_REGION });  // Using the new S3 client
const Location = require('./models').Location;
const MenuItem = require('./models').MenuItem;
const Coupon = require('./models').Coupon;

// Set up Multer to store files in S3
const upload = multer({
  storage: multer.memoryStorage(),  // Store in memory before sending to S3
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
}).single('image');  // Field name is 'image'

// Function to upload the image to S3
const uploadToS3 = async (file, folder, res) => {
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `${Date.now()}.${fileExtension}`;
  const key = `${folder}/${fileName}`;

  // Determine the Content-Type based on the file extension
  let contentType = 'application/octet-stream'; // Default content type (for unsupported file types)
  if (fileExtension === 'jpeg' || fileExtension === 'jpg') {
    contentType = 'image/jpeg';
  } else if (fileExtension === 'png') {
    contentType = 'image/png';
  } else if (fileExtension === 'gif') {
    contentType = 'image/gif';
  }

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: contentType
    });

    const data = await s3.send(command);
    return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
  } catch (err) {
    console.error('Error uploading to S3:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

// API route for Location Image Upload
const uploadLocationImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      // Return the error early if something goes wrong
      return res.status(400).json({ error: err.message });
    }

    const folder = `locations/${req.params.locationId}`;
    const imageUrl = await uploadToS3(req.file, folder, res);

    try {
      const location = await Location.findByIdAndUpdate(
        req.params.locationId,
        { logo: imageUrl },
        { new: true }
      );
      return res.status(200).json(location);  // Ensure the response is sent only once
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update location' });
    }
  });
};


// API route for Menu Item Image Upload
const uploadMenuItemImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const folder = `menu-items/${req.params.menuItemId}`;
    const imageUrl = await uploadToS3(req.file, folder, res);

    try {
      const menuItem = await MenuItem.findByIdAndUpdate(
        req.params.menuItemId,
        { image: imageUrl },
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

    const folder = `coupons/${req.params.couponId}`;
    const imageUrl = await uploadToS3(req.file, folder, res);

    try {
      const coupon = await Coupon.findByIdAndUpdate(
        req.params.couponId,
        { image: imageUrl },
        { new: true }
      );
      res.status(200).json(coupon);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update coupon' });
    }
  });
};

module.exports = {
  upload,
  uploadLocationImage,
  uploadMenuItemImage,
  uploadCouponImage,
};
