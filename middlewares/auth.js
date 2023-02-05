const jwt = require('jsonwebtoken')
const usersModels = require('../models/users.models')
async function AuthMiddleware (req, res, next) {
  const { access_token } = req.headers
  try {
    const payload = jwt.verify(access_token, process.env.JWT_SECRET_KEY)

    const userToken = await usersModels.findOne({ email: payload.email })

    if (userToken) {
      req.userData = {
        _id: userToken._id,
        email: userToken.email
      }
      next()
    } else {
      throw new Error('Unauthorized')
    }
  } catch (err) {
    if (err.message === 'Unauthorized') {
      res.status(401).json({
        err: err.message
      })
    } else {
      res.status(500).json({
        err: 'Internal Server Error'
      })
    }
  }
}

module.exports = {
  AuthMiddleware
}
