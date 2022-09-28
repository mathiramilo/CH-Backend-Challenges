const path = require('path')
const express = require('express')
const { Server: HttpServer } = require('http')
const { Server: SocketServer } = require('socket.io')
const logger = require('./middlewares/logger')
const apiRoutes = require('./routes/api/apiRoutes')
const webRoutes = require('./routes/web/webRoutes')
const Container = require('./models/Container')

const container = new Container('products.json')

const PORT = process.env.PORT || 8080

const app = express()
const http = new HttpServer(app)
const io = new SocketServer(http)

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(logger)

// Routes
app.use(webRoutes)
app.use('/api', apiRoutes)
app.get('*', (req, res) => {
  res.status(404).sendFile(path.resolve('public/pages/404.html'))
})

// Http server init & config
const server = http.listen(PORT, () => {
  console.log(`Server is up and running on port ${PORT}`)
})

server.on('error', error => {
  console.error(`Error: ${error}`)
})

// Socket Events
io.on('connection', async socket => {
  console.log('New client connection - ID:', socket.id)

  // Getting all products
  const products = await container.getAll()
  socket.emit('products', { products })

  // New Product
  socket.on('new-product', async data => {
    const products = await container.getAll()
    io.emit('products', { products })
  })
})
