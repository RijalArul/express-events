const express = require('express')
require('dotenv').config()
const { connectDB } = require('./db/db')
const usersModels = require('./models/users.models')
const { hashPass, comparePass } = require('./helpers/bcrypt')
const { signToken } = require('./helpers/jwt')
const { AuthMiddleware } = require('./middlewares/auth')
var moment = require('moment-timezone')
const { google } = require('googleapis')
const eventsModels = require('./models/events.models')

const app = express()

const SERVER_PORT = 3030

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

connectDB()

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID_GOOGLE,
  process.env.CLIENT_SECRET_GOOGLE
)

oauth2Client.setCredentials({
  access_token: process.env.CLIENT_ACCESS_TOKEN_GOOGLE,
  refresh_token: process.env.CLIENT_REFRESH_TOKEN_GOOGLE,
  expiry_date: '3 days'
})

app.post('/users/register', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await usersModels.create({
      email: email,
      password: hashPass(password)
    })

    res.status(201).json({
      data: user
    })
  } catch (err) {
    if (err.code == 11000) {
      res.status(400).json({
        err: `${err.keyValue.email} is already exists`
      })
    } else if (err._message === 'User validation failed') {
      res.status(400).json({
        err: err.message
      })
    } else {
      res.status(500).json({
        err: 'Internal Server Error'
      })
    }
  }
})

app.post('/users/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await usersModels.findOne({ email: email })

    if (user) {
      const validPass = comparePass(password, user.password)
      if (validPass) {
        const userData = { email: user.email, id: user._id }
        const accessToken = signToken(userData)
        res.status(200).json({
          data: accessToken
        })
      } else {
        throw new Error('Invalid_Pass')
      }
    } else {
      throw new Error('Email_Not_Found')
    }
  } catch (err) {
    if (err.message === 'Invalid_Pass') {
      res.status(400).json({
        err: 'Invalid Password'
      })
    } else if (err.message === 'Email_Not_Found') {
      res.status(404).json({
        err: 'Email Is Not Found'
      })
    } else {
      res.status(500).json({
        err: 'Internal Server Error'
      })
    }
  }
})

app.post('/events', AuthMiddleware, async (req, res) => {
  try {
    const { name, start_date, end_date, attendees } = req.body
    const formatStartDate = moment(new Date(start_date))
      .tz('Asia/Jakarta')
      .format()
    const formatEndDate = moment(new Date(end_date)).tz('Asia/Jakarta').format()

    const payload = {
      name,
      start_date: formatStartDate,
      end_date: formatEndDate,
      status: 'Belum Dilaksanakan',
      attendees: [...attendees, req.userData._id],
      owners: req.userData._id
    }

    const event = await eventsModels.create(payload)

    for (let i = 0; i < event.attendees.length; i++) {
      const emailUser = await usersModels.find({ _id: event.attendees[i] })
      for (let j = 0; j < emailUser.length; j++) {
        const d = new Date()
        const calendar = google.calendar({ version: 'v3', oauth2Client })
        const newEvent = {
          summary: event.name,
          description: event.name + event._id,
          start: {
            dateTime: event.start_date,
            timeZone: 'Asia/Jakarta'
          },
          end: {
            dateTime: event.end_date,
            timeZone: 'Asia/Jakarta'
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 1 },
              { method: 'popup', minutes: 1 }
            ]
          },
          attendees: [
            {
              email: emailUser[j].email
            }
          ]
        }
        calendar.events
          .insert({
            auth: oauth2Client,
            calendarId: process.env.CLIENT_CALENDAR_ID_GOOGLE,
            resource: newEvent,
            sendNotifications: true
          })
          .then(event => console.log('Event created: %s', event))
          .catch(error => console.log('Some error occured', error))
      }
    }

    res.status(201).json({
      data: event
    })
  } catch (err) {
    if (err._message === 'Event validation failed') {
      res.status(400).json({
        err: err._message
      })
    } else {
      res.status(500).json({
        err: 'internal Server Error'
      })
    }
  }
})

app.get('/events', AuthMiddleware, async (req, res) => {
  try {
    const events = await eventsModels.find({ attendees: req.userData._id })
    const dateStatus = moment(new Date()).tz('Asia/Jakarta').format()
    for (let i = 0; i < events.length; i++) {
      if (
        events[i].start_date <= dateStatus &&
        events[i].end_date >= dateStatus
      ) {
        await eventsModels.updateMany(
          { _id: events[i]._id },
          { status: 'Sedang Dilaksanakan' }
        )
      } else if (events[i].start_date > dateStatus) {
        await eventsModels.updateMany(
          { _id: events[i]._id },
          { status: 'Belum Dilaksanakan' }
        )
      } else if (events[i].end_date < dateStatus) {
        await eventsModels.updateMany(
          { _id: events[i]._id },
          { status: 'Sudah Dilaksanakan' }
        )
      }
    }

    res.status(200).json({
      data: events
    })
  } catch (err) {
    res.status(500).json({
      err: 'Internal Server Error'
    })
  }
})

module.exports = app
