/* Server-related tasks */

/* Dependencies */
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const { StringDecoder } = require('string_decoder')
const config = require('./config')
const DBI = require('./databaseInterface')
const routes = require('./routes')
const helpers = require('./helpers')
const util = require('util')
const debug = util.debuglog('server')

/* Instantiate the server module object */
const server = {}

/** Instantiate the http server */
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res)
})

/* command to generate https certificates:
openssl req -newkey rsa:2018 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem */
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
}

/** Instantiate the https server */
server.httpsServer = https.createServer(
  server.httpsServerOptions,
  (req, res) => {
    server.unifiedServer(req, res)
  }
)

/* All server logic for http and https */
server.unifiedServer = (req, res) => {
  /* Get the base URL string */
  let base =
    req.headers.host.split(':')[1] === config.httpPort
      ? `http://${req.headers.host}/`
      : `https://${req.headers.host}/`
  /* Get the URL object */
  let parsedUrl = new URL(req.url, base)

  /* Get the path */
  let path = parsedUrl.pathname
  let trimmedPath = path.replace(/^\/+|\/+$/g, '')

  /* Get the query string as a plain object */
  let searchParams = parsedUrl.searchParams
  let queryStringObject = {}
  searchParams.forEach((value, name) => {
    if (queryStringObject[name] === undefined) {
      queryStringObject[name] = value
    } else if (Array.isArray(queryStringObject[name])) {
      queryStringObject[name].push(value)
    } else {
      queryStringObject[name] = [queryStringObject[name], value]
    }
  })

  /* Get the http method */
  let method = req.method.toLowerCase()

  /* Get the headers as an object */
  let headers = req.headers

  /* Get the payload if any */
  let decoder = new StringDecoder()
  let payload = ''
  req.on('data', (data) => {
    payload += decoder.write(data)
  })
  req.on('end', () => {
    payload + decoder.end()

    /* Choose the handler this request shoud go to */
    let chosenHandler =
      typeof server.router[trimmedPath] !== 'undefined'
        ? server.router[trimmedPath]
        : routes.notFound

    /* Send all non public non routed paths to react, to avoid page reload problems */
    if (
      !Object.keys(server.router).includes(trimmedPath) &&
      !trimmedPath.includes('public/')
    ) {
      chosenHandler = react
    }

    /* If this request is within the public directory, use the public handler instead */
    chosenHandler = trimmedPath.includes('public/')
      ? routes.public
      : chosenHandler

    /* Construct the data object to send to the handler */
    let data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(payload)
    }

    try {
      /* Route the request to the handler specified in the router */
      chosenHandler(data, (statusCode, payload, contentType = 'json') => {
        server.processHandlerResponse(
          res,
          method,
          trimmedPath,
          statusCode,
          payload,
          contentType
        )
      })
    } catch (e) {
      debug(e)
      server.processHandlerResponse(
        res,
        method,
        trimmedPath,
        500,
        {
          Error: 'An unknown error occured'
        },
        'json'
      )
    }
  })
}

server.processHandlerResponse = (
  res,
  method,
  trimmedPath,
  statusCode,
  payload,
  contentType
) => {
  /* Use the status code called back by the handler, or default to 200 */
  statusCode = typeof statusCode == 'number' ? statusCode : 200

  /* Return the response-parts that are content-specific */
  if (contentType === 'json') {
    res.setHeader('Content-Type', 'application/json')
    payload = typeof payload === 'object' ? payload : {}
    payloadString = JSON.stringify(payload)
  } else if (contentType === 'html') {
    res.setHeader('Content-Type', 'text/html')
    payloadString = typeof payload === 'string' ? payload : ''
  } else if (contentType === 'js') {
    res.setHeader('Content-Type', 'text/javascript')
    payloadString = typeof payload !== 'undefined' ? payload : ''
  } else if (contentType === 'favicon') {
    res.setHeader('Content-Type', 'image/x-icon')
    payloadString = typeof payload !== 'undefined' ? payload : ''
  } else if (contentType === 'css') {
    res.setHeader('Content-Type', 'text/css')
    payloadString = typeof payload !== 'undefined' ? payload : ''
  } else if (contentType === 'png') {
    res.setHeader('Content-Type', 'image/png')
    payloadString = typeof payload !== 'undefined' ? payload : ''
  } else if (contentType === 'jpg') {
    res.setHeader('Content-Type', 'image/jpeg')
    payloadString = typeof payload !== 'undefined' ? payload : ''
  } else if (contentType === 'plain') {
    res.setHeader('Content-Type', 'text/plain')
    payloadString = typeof payload !== 'undefined' ? payload : ''
  }

  /* Return the response-parts that are common to all content-types*/
  res.writeHead(statusCode)
  res.end(payloadString)

  /* If the response is ok print green or print red */
  if (200 <= statusCode && statusCode < 300) {
    debug(
      '\x1b[32m%s\x1b[0m',
      `${method.toUpperCase()} /${trimmedPath} ${statusCode}`
    )
  } else {
    debug(
      '\x1b[31m%s\x1b[0m',
      `${method.toUpperCase()} /${trimmedPath} ${statusCode}`
    )
  }
}

/* Define a request router */
server.router = {
  home: routes.index,
  'account/create': routes.accountCreate,
  'account/edit': routes.accountEdit,
  'account/deleted': routes.accountDeleted,
  'session/create': routes.sessionCreate,
  'session/deleted': routes.sessionDeleted,
  'checks/all': routes.checksList,
  'checks/create': routes.checksCreate,
  'checks/edit': routes.checksEdit,
  'favicon.ico': routes.favicon,
  public: routes.public,
  ping: routes.ping,
  'api/users': routes.users,
  'api/tokens': routes.tokens,
  'api/checks': routes.checks
}

async function react(data, callback) {
  let html = await fs.promises.readFile(
    path.join(__dirname, './../public/react/index.html'),
    'utf8'
  )
  callback(200, html, 'html')
}

/* Init script */
server.init = () => {
  /* Start the http server */
  server.httpServer.listen(config.httpPort, () => {
    console.log(
      '\x1b[36m%s\x1b[0m',
      `http server is listening on port:${config.httpPort} in ${config.envName} mode`
    )
  })
  /* Start the https server */
  server.httpsServer.listen(config.httpsPort, () => {
    console.log(
      '\x1b[36m%s\x1b[0m',
      `https server is listening on port:${config.httpsPort} in ${config.envName} mode`
    )
  })
}

/* Export the module */
module.exports = server
