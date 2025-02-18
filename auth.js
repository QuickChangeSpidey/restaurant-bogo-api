const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Configure the JWKS client to fetch the public keys from your Cognito User Pool.
// Ensure you have these environment variables set: AWS_REGION and COGNITO_USER_POOL_ID.
const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});

// Callback function to retrieve the signing key based on the kid in the header.
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

/**
 * Middleware to verify JWT tokens issued by AWS Cognito.
 * Expects the token in the "Authorization" header as "Bearer <token>".
 */
const checkAuth = (req, res, next) => {
  // Extract token from header.
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized access: No token provided.' });
  }

  // Verify the token using Cognito's public key.
  jwt.verify(token, getKey, {}, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

/**
 * Middleware for role-based authorization.
 * It checks if the token payload (from AWS Cognito) includes the allowed role(s)
 * in the "cognito:groups" array.
 */
const checkRole = (...allowedRoles) => (req, res, next) => {
  // Cognito returns the groups in "cognito:groups" (if the user belongs to any groups).
  const userGroups = req.user["cognito:groups"] || [];
  const hasAllowedRole = allowedRoles.some(role => userGroups.includes(role));
  if (!hasAllowedRole) {
    return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
  }
  next();
};

// This middleware checks for a valid API key in the x-api-key header.
const secureInternal = (req, res, next) => {
    const token = req.headers['x-api-key'];
    if (!token || token !== process.env.INTERNAL_API_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

module.exports = { checkAuth, checkRole, secureInternal };
