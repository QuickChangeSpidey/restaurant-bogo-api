const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0', // or '2.0'
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'A sample API'
  },
  servers: [
    {
      url: 'http://localhost:5000', // your server’s base URL
    },
  ],
};

// Options for swagger-jsdoc
const options = {
  swaggerDefinition,
  // Path to your API route files where you have documented your endpoints with JSDoc
  apis: ['./routes.js', './models.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
