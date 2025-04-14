const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const cors = require('cors')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Enable CORS
      cors()(req, res, () => {});
      
      // Remove CSP headers in development
      if (dev) {
        res.removeHeader('Content-Security-Policy')
      }

      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      
      // Send a proper JSON error response
      res.writeHead(500, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      })
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: dev ? err.message : 'Something went wrong'
      }))
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})