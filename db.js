const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://restaurantDB:Vancouver%40123@bogo-ninja-restaurant-d.cgzrq.mongodb.net/?retryWrites=true&w=majority&appName=bogo-ninja-restaurant-db"

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas successfully.");
    return client; // Return the connected client for other modules to use
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1); // Exit the app if unable to connect
  }
}

module.exports = connectDB;
