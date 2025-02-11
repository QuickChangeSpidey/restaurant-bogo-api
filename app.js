const express = require("express");
require('dotenv').config();
const bodyParser = require("body-parser");
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// 1) Connect to MongoDB before routes
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Mongoose connected successfully');

    // 2) Start the server after successful connection
    app.listen(process.env.PORT, () => {
      console.log('Server is running on port 5000');
      console.log('Swagger docs at http://localhost:5000/api-docs (Admin Only)');
    });
  })
  .catch(error => {
    console.error('Error connecting to MongoDB', error);
    process.exit(1);
  });

// Protected Swagger route
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// Define routes
app.use("/", require("./routes"));

app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

