const express = require('express')
require('dotenv').config()
const { connectDB } = require('./db/db')
const usersModels = require('./models/users.models')
const { hashPass, comparePass } = require('./helpers/bcrypt')
const { signToken } = require('./helpers/jwt')

const app = express()

const SERVER_PORT = 3030

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

connectDB()

app.post('/users/register', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await usersModels.create({
      email: email,
      password: hashPass(password)
    })

    res.status(201).json({
      data: user,
      message: 'Create User'
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
          data: accessToken,
          message: 'Login Success'
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

app.listen(SERVER_PORT, () => {
  console.log(`App Is Listening on Port ${SERVER_PORT}`)
})
