const jwt = require('jsonwebtoken')
const secretKeyJWT = process.env.JWT_SECRET_KEY

function signToken (userData) {
  const sign = jwt.sign(userData, secretKeyJWT)
  return sign
}

module.exports = {
  signToken
}
