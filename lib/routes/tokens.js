/* All tokens routing logic */

/* Dependencies */
const helpers = require('../helpers')
const DBI = require('../databaseInterface')

/* Tokens */
const tokens = {}

/* Post
Required data: phone, password
Optional data: none */
tokens.post = (data, callback) => {
  let phone = helpers.validate.phone(data.payload.phone)
  let password = helpers.validate.password(data.payload.password)
  if (phone && password) {
    /* Lookup the user */
    DBI.read('users', phone, (err, userData) => {
      if (!err && userData) {
        // Hash the send password and compare it to the stored password
        let hashedPassword = helpers.hash(password)
        if (hashedPassword === userData.hashedPassword) {
          // Create a new token with a random name that expires in 1 hour
          let id = helpers.createRandomString(20)
          let expires = Date.now() + 1000 * 60 * 60
          let tokenObject = { id, phone, expires }

          // Store the data
          DBI.create('tokens', id, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject)
            } else {
              callback(500, { Error: 'Could not create the new token' })
            }
          })
        } else {
          callback(400, { Error: 'Invalid user info' })
        }
      } else {
        callback(400, { Error: 'Invalid user info' })
      }
    })
  } else {
    callback(400, { Error: 'Missing or invalid required fields' })
  }
}

/* Get
Required data: id
Optional data: none */
tokens.get = (data, callback) => {
  /* Check that the token id is valid */
  let tokenId = helpers.validate.id(data.queryStringObject.id)
  if (tokenId) {
    /* Lookup the user */
    DBI.read('tokens', tokenId, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData)
      } else {
        callback(404)
      }
    })
  } else {
    callback(400, { Error: 'Missing or invalid required field' })
  }
}

/* Put
Required data: id, extend
Optional data: none */
tokens.put = (data, callback) => {
  let tokenId = helpers.validate.id(data.payload.id)
  let extend = helpers.validate.boolean(data.payload.extend)

  if (tokenId && extend) {
    /* Lookup the token */
    DBI.read('tokens', tokenId, (err, tokenData) => {
      if (!err && tokenData) {
        // Check if token is not expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60

          // Store the new updates
          DBI.update('tokens', tokenId, tokenData, (err) => {
            if (!err) {
              callback(204)
            } else {
              callback(500, { Error: 'Could not update the token' })
            }
          })
        } else {
          callback(400, { Error: 'The token has already expired' })
        }
      } else {
        callback(400, { Error: 'Token does not exist' })
      }
    })
  } else {
    callback(400, { Error: 'Missing or invalid required fields' })
  }
}

/* Delete
Required data: id
Optional data: none */
tokens.delete = (data, callback) => {
  /* Check that the token id is valid */
  let tokenId = helpers.validate.id(data.queryStringObject.id)
  if (tokenId) {
    /* Lookup the token */
    DBI.read('tokens', tokenId, (err, tokenData) => {
      if (!err && tokenData) {
        DBI.delete('tokens', tokenId, (err) => {
          if (!err) {
            callback(204)
          } else {
            callback(500, { Error: 'Could not delete the specified token' })
          }
        })
      } else {
        callback(400, { Error: 'Could not find the specified token' })
      }
    })
  } else {
    callback(400, { Error: 'Missing or invalid required field' })
  }
}

/* Export */
module.exports = tokens
