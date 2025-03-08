const AWS = require('aws-sdk');

// Configure AWS SDK with your credentials and region
AWS.config.update({
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

module.exports = s3;