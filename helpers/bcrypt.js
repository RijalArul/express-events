const bcrypt = require('bcryptjs')
const salt = bcrypt.genSaltSync(10)

function hashPass (password) {
  return bcrypt.hashSync(password, salt)
}

function comparePass (password, hashPass) {
  return bcrypt.compareSync(password, hashPass)
}

module.exports = {
  hashPass,
  comparePass
}
