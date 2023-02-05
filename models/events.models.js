const mongoose = require('mongoose')

const EventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    start_date: {
      type: String,
      required: true
    },
    end_date: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    owners: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    },
    attendees: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { collection: 'events' }
)

module.exports = mongoose.model('Event', EventSchema)
