const mongoose = require('mongoose')
const database_url = process.env.DB_URI

const connectDB = () => {
  mongoose
    .connect(database_url, { useNewUrlParser: true })
    .then(resp => {
      console.log('Success>>>')
    })
    .catch(err => {
      console.log('Error>>>')
    })
}

module.exports = {
  connectDB
}
