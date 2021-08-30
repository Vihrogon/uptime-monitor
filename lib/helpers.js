/* Helpers for various tasks */

/* Dependencies */
const crypto = require('crypto')
const http = require('http')
const https = require('https')
const config = require('./config')
const path = require('path')
const fs = require('fs')

/* Helpers */
const helpers = {}

/** Verify that a user has a valid token
 * @param {string} tokenId
 * @param {string} userPhone
 * @param {Function} callback
 */
helpers.verifyToken = (tokenId, userPhone, callback) => {
  /* Lookup the token */
  const DBI = require('./databaseInterface')
  DBI.read('tokens', tokenId, (err, tokenData) => {
    if (!err && tokenData) {
      // Check that the token is for the given user and is not expired
      if (tokenData.phone === userPhone && tokenData.expires > Date.now()) {
        callback(true)
      } else {
        callback(false)
      }
    } else {
      callback(false)
    }
  })
}

/** Create a SHA256 hash */
helpers.hash = (str) => {
  if (typeof str === 'string' && str.length > 0) {
    let hash = crypto
      .createHmac('sha256', config.hashingSecret)
      .update(str)
      .digest('hex')
    return hash
  } else {
    return false
  }
}

/** Create a random string of given length
 * @param {number} length
 * @returns {string)}
 */
helpers.createRandomString = (length) => {
  length = typeof length === 'number' && length > 0 ? length : 20
  let possibleCharacters =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
  let str = ''
  for (let n = 0; n < length; n++) {
    str += possibleCharacters.charAt(
      Math.floor(Math.random() * possibleCharacters.length)
    )
  }
  return str
}

/* Parse a JSON string to an object in all cases without throwing error */
helpers.parseJsonToObject = (str) => {
  try {
    let obj = JSON.parse(str)
    return obj
  } catch (e) {
    return {}
  }
}

/* Validate input fields */
helpers.validate = {
  boolean: (value) => {
    return typeof value === 'boolean' && value ? true : false
  },
  string: (value) => {
    return typeof value === 'string' && value.trim().length
      ? value.trim()
      : false
  },
  object: (value) => {
    return typeof value === 'object' && value ? value : false
  },
  phone: (value) => {
    let phone = helpers.validate.string(value)
    return phone.length === 10 ? phone : false
  },
  password: (value) => {
    let password = helpers.validate.string(value)
    return password.length >= 6 ? password : false
  },
  id: (value) => {
    let id = helpers.validate.string(value)
    return id.length === 20 ? id : false
  },
  protocol: (value) => {
    let protocol = helpers.validate.string(value)
    return ['http', 'https'].includes(protocol) ? protocol : false
  },
  method: (value) => {
    let method = helpers.validate.string(value)
    return ['get', 'post', 'put', 'delete'].includes(method) ? method : false
  },
  successCodes: (value) => {
    return typeof value === 'object' && value instanceof Array && value.length
      ? value
      : false
  },
  timeoutSeconds: (value) => {
    return typeof value === 'number' &&
      value % 1 === 0 &&
      value >= 1 &&
      value <= 5
      ? value
      : false
  },
  sms: (value) => {
    let string = helpers.validate.string(value)
    return string.length <= 1600 ? string : false
  },
  state: (value) => {
    let state = helpers.validate.string(value)
    return ['up', 'down'].includes(state) ? state : 'down'
  },
  lastChecked: (value) => {
    return typeof value === 'number' && value > 0 ? value : false
  }
}

/* Send an SMS via Twilio */
helpers.twilioSendSMS = (phone, msg, callback) => {
  /* Validate the parameters */
  phone = helpers.validate.phone(phone)
  msg = helpers.validate.sms(msg)
  console.log(phone)
  console.log(msg)
  if (phone && msg) {
    /* Configure the request payload */
    let payload = {
      From: config.twilio.fromPhone,
      To: '+359' + phone,
      Body: msg
    }
    /* Serialize the payload  */
    let stringPayload = new URLSearchParams(payload).toString()

    let requestDetails = {
      protocol: 'https:',
      hostname: 'api.twilio.com',
      method: 'POST',
      path: `/2010-04-01/Accounts/${config.twilio.accountID}/Messages.json`,
      auth: config.twilio.accountID + ':' + config.twilio.authToken,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-length': Buffer.byteLength(stringPayload)
      }
    }
    /* Instantiate the request object */
    let req = https.request(requestDetails, (res) => {
      let status = res.statusCode
      if (status === 200 || status === 201) {
        callback(false)
      } else {
        callback('Status code returned:' + status)
      }
    })
    /* Bind to the error event so it doesn't get trown */
    req.on('error', (e) => {
      callback(e)
    })

    req.write(stringPayload)

    req.end()
  } else {
    callback('Missing or invalid required parameters')
  }
}

/** Get the string content of a template */
helpers.getTemplate = (templateName, data, callback) => {
  templateName = helpers.validate.string(templateName)
  data = helpers.validate.object(data)
  if (templateName) {
    let templatesDir = path.join(__dirname, '/../public/templates/')
    fs.readFile(templatesDir + templateName + '.html', 'utf8', (err, str) => {
      if (!err && str && str.length) {
        /* Interpolate the html before returning */
        let html = helpers.interpolate(str, data)
        callback(false, html)
      } else {
        callback('No template could be found')
      }
    })
  } else {
    callback('Invalid template name')
  }
}

/** Take a given string and a data object and find/replace all the keys in it
 * @param {string} str - The string to apply interpolation on
 * @param {Object} data - Key/Value pairs to find/replace in the string
 * @return {string} The interpolated string
 * @TODO Refactor so this is called only once per request */
helpers.interpolate = (str, data) => {
  str = helpers.validate.string(str)
  data = helpers.validate.object(data)

  /* Add the template globals to the data object, prepending their name with 'global' */
  for (let keyName in config.templateGlobals) {
    data['global.' + keyName] = config.templateGlobals[keyName]
  }

  /* For each key in the data object, insert its value into the string at the corresponding placeholder */
  for (let key in data) {
    if (data.hasOwnProperty(key) && typeof data[key] === 'string') {
      let replace = data[key]
      let find = `{${key}}`
      str = str.replace(find, replace)
    }
  }
  return str
}

/* Wrap the page template around the content and pass provided data object */
helpers.pageWrapper = (str, data, callback) => {
  str = helpers.validate.string(str)
  data = helpers.validate.object(data)

  helpers.getTemplate('page', data, (err, pageStr) => {
    if (!err && pageStr) {
      let pages = pageStr.split('{{template::}}')
      let html = pages[0] + str + pages[1]
      callback(false, html)
    } else {
      callback('Could not get the specified template')
    }
  })
}

/* Get the contents of a static asset */
helpers.getStaticAsset = (fileName, callback) => {
  fileName = helpers.validate.string(fileName)
  if (fileName) {
    let publicDir = path.join(__dirname, '/../public/')
    fs.readFile(publicDir + fileName, (err, data) => {
      if (!err && data) {
        callback(false, data)
      } else {
        callback("Can't find file")
      }
    })
  } else {
    callback('Invalid file name')
  }
}

/** Makes a GET request to localhost for testing purposes
 * @param {string} path - API endpoint
 * @param {Function} callback - returns the response to the caller
 * @returns {void}
 */
helpers.makeGetRequest = (path, callback) => {
  let requestDetails = {
    protocol: 'http:',
    hostname: 'localhost',
    port: config.httpPort,
    method: 'GET',
    path,
    headers: { 'Content-Type': 'application/json' }
  }
  let result
  let req = http.request(requestDetails, (res) => {
    callback(res)
  })
  req.end()
}

/* Export the module*/
module.exports = helpers
