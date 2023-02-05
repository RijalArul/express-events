const app = require('../app')

const SERVER_PORT = process.env.SERVER_PORT || 3030

app.listen(SERVER_PORT, () => {
  console.log(`App listening on SERVER_PORT ${SERVER_PORT}`)
})
