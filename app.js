const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./db");
const cors = require('cors');
const QRCode = require('qrcode'); // Add QR code generation dependency
const { checkAuth, checkRole } = require('./auth');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Connect to MongoDB
(async () => {
  try {
    const dbClient = await connectDB();
    app.locals.db = dbClient.db("bogo-ninja-restaurant-db"); // Attach the database instance to app.locals
  } catch (err) {
    console.error("Failed to connect to MongoDB. Exiting...");
    process.exit(1);
  }
})();

// Define routes
app.use("/api", require("./routes"));

// QR code generation
app.post('/api/locations/:id/generate-qr', checkAuth, checkRole('Restaurant'), async (req, res) => {
  try {
      const { id } = req.params;


      if (!location) {
          return res.status(404).json({ error: 'Location not found' });
      }

      // Generate QR code with location details
      const qrCodeText = `${id}`;
      const qrCode = await QRCode.toDataURL(qrCodeText);

      // Update the location with the generated QR code
      location.qrCode = qrCode;
      await location.save();

      res.status(200).json({ message: 'QR code generated successfully', qrCode });
  } catch (err) {
      res.status(500).json({ error: 'Failed to generate QR code', details: err.message });
  }
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
