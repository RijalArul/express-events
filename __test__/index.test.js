const mongoose = require('mongoose')
const request = require('supertest')
const app = require('../app')
const { hashPass } = require('../helpers/bcrypt')
const usersModels = require('../models/users.models')

let user

beforeEach(async () => {
  user = {
    email: 'rijal121@mail.com',
    password: hashPass('123456')
  }

  const userData = await usersModels.create(user)
  user = userData
})

afterEach(async () => {
  await usersModels.findOneAndDelete({ _id: user._id })
})

/* Closing database connection after each test. */
afterEach(async () => {
  await mongoose.connection.close()
})

describe('POST /users/register', () => {
  it('should return new user', async () => {
    try {
      const user = {
        email: 'rijal3@gmail.com',
        password: hashPass('123456')
      }

      const res = await request(app).post('/users/register').send(user)
      expect(res.statusCode).toBe(201)
      expect(res.body).toHaveProperty('data', res.body.data)
    } catch (err) {
      console.log('err>>>>>>>>>>>>>>>>', err)
    }
  })
})

describe('POST /users/login', () => {
  it('should return login success access token', async () => {
    const user = {
      email: 'rijal3@gmail.com',
      password: hashPass('123456')
    }

    const res = await request(app).post('/users/login').send(user)
    expect(res.statusCode).toEqual(200)
    expect(res.body).toHaveProperty('data', res.body.data)
    done()
  })
})
