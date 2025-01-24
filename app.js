const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./db");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
