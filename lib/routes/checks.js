/* All checks routing logic */

/* Dependencies */
const helpers = require('../helpers')
const DBI = require('../databaseInterface')
const config = require('../config')
const { time } = require('console')

/* Tokens */
const checks = {}

/* Post
required data: protocol, url, method, successCodes, timeoutSeconds
optional data: none */
checks.post = (data, callback) => {
  /* Validate all the inputs */
  let protocol = helpers.validate.protocol(data.payload.protocol)
  let url = helpers.validate.string(data.payload.url)
  let method = helpers.validate.method(data.payload.method)
  let successCodes = helpers.validate.successCodes(data.payload.successCodes)
  let timeoutSeconds = helpers.validate.timeoutSeconds(
    data.payload.timeoutSeconds
  )

  if (protocol && url && method && successCodes && timeoutSeconds) {
    /* Get the token from the header */
    let tokenId = helpers.validate.string(data.headers.token)

    /* Lookup the user by reading the token */
    DBI.read('tokens', tokenId, (err, tokenData) => {
      if (!err && tokenData) {
        let userPhone = tokenData.phone

        DBI.read('users', userPhone, (err, userData) => {
          if (!err && userData) {
            let userChecks =
              typeof userData.checks === 'object' &&
              userData.checks instanceof Array
                ? userData.checks
                : []
            // Enforce number of checks per user
            if (userChecks.length < config.maxChecks) {
              // Creade a random id for the check
              let checkId = helpers.createRandomString(20)

              // Create the check object and include the user phone
              let checkObject = {
                id: checkId,
                userPhone,
                protocol,
                url,
                method,
                successCodes: successCodes,
                timeoutSeconds
              }

              // Save the object
              DBI.create('checks', checkId, checkObject, (err) => {
                if (!err) {
                  // Add the check id to the user object
                  userData.checks = userChecks
                  userData.checks.push(checkId)

                  // Save the new user data
                  DBI.update('users', userPhone, userData, (err) => {
                    if (!err) {
                      callback(200, checkObject)
                    } else {
                      callback(500, {
                        Error: 'Could not update the user with the new check'
                      })
                    }
                  })
                } else {
                  callback(500, { Error: 'Could not create the new check' })
                }
              })
            } else {
              callback(400, {
                Error: 'The user already has the maximum number of checks'
              })
            }
          } else {
            callback(403)
          }
        })
      } else {
        callback(403)
      }
    })
  } else {
    callback(400, { Error: 'Missing or invalid required fields' })
  }
}

/* GET
Required data: id
Optional data: none */
checks.get = (data, callback) => {
  /* Check that the id is valid */
  let checkId = helpers.validate.id(data.queryStringObject.id)
  if (checkId) {
    /* Lookup the check */
    DBI.read('checks', checkId, (err, checkData) => {
      if (!err && checkData) {
        /* Get the token from the headers */
        let token =
          typeof data.headers.token === 'string' ? data.headers.token : false
        /* Verify that the given token is valid and belongs to the user */
        helpers.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
          if (tokenIsValid) {
            /* Return the check data */
            callback(200, checkData)
          } else {
            callback(403)
          }
        })
      } else {
        callback(404)
      }
    })
  } else {
    callback(400, { Error: 'Missing or invalid required field' })
  }
}

/* PUT
Required data: id
Optional data: protocol, method, successCodes, timeoutSeconds
(at least one must be given) */
checks.put = (data, callback) => {
  /* Check for the required field */
  let checkId = helpers.validate.id(data.payload.id)
  if (checkId) {
    /* Check to make sure at least one field has been send to update */
    let protocol = helpers.validate.protocol(data.payload.protocol)
    let url = helpers.validate.string(data.payload.url)
    let method = helpers.validate.method(data.payload.method)
    let successCodes = helpers.validate.successCodes(data.payload.successCodes)
    let timeoutSeconds = helpers.validate.timeoutSeconds(
      data.payload.timeoutSeconds
    )
    if (protocol || url || method || successCodes || timeoutSeconds) {
      /* Lookup the check */
      DBI.read('checks', checkId, (err, checkData) => {
        if (!err && checkData) {
          /* Get the token from the headers */
          let token =
            typeof data.headers.token === 'string' ? data.headers.token : false
          /* Verify that the given token is valid and belongs to the user */
          helpers.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
            if (tokenIsValid) {
              /* Update the check where necessary */
              if (protocol) {
                checkData.protocol = protocol
              }
              if (url) {
                checkData.url = url
              }
              if (method) {
                checkData.method = method
              }
              if (successCodes) {
                checkData.successCodes = successCodes
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds
              }
              /* Store the changes */
              DBI.update('checks', checkId, checkData, (err) => {
                if (!err) {
                  callback(200)
                } else {
                  callback(500, { Error: 'Could not update the check' })
                }
              })
            } else {
              callback(403)
            }
          })
        } else {
          callback(400, { Error: 'Check id did not exist' })
        }
      })
    } else {
      callback(400, { Error: 'Missing fields to update' })
    }
  } else {
    callback(400, { Error: 'Missing or invalid required field' })
  }
}

/* DELETE
Required: id
Optional: none */
checks.delete = (data, callback) => {
  /* Check that the check id is valid */
  let id = helpers.validate.id(data.queryStringObject.id)
  if (id) {
    /* Lookup the check */
    DBI.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        /* Get the token from the headers */
        let token =
          typeof data.headers.token === 'string' ? data.headers.token : false
        /* Verify that the given token is valid for the phone number */
        helpers.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
          if (tokenIsValid) {
            /* Delete the check data */
            DBI.delete('checks', id, (err) => {
              if (!err) {
                DBI.read('users', checkData.userPhone, (err, userData) => {
                  if (!err && userData) {
                    /* Remove the check id from the user checks array */
                    let userChecks =
                      typeof userData.checks === 'object' &&
                      userData.checks instanceof Array
                        ? userData.checks
                        : false
                    let checkPosition = userChecks.indexOf(id)
                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition, 1)
                      /* Update the user */
                      DBI.update(
                        'users',
                        checkData.userPhone,
                        userData,
                        (err) => {
                          if (!err) {
                            callback(200)
                          } else {
                            callback(500, {
                              Error: 'Could not update the user'
                            })
                          }
                        }
                      )
                    } else {
                      callback(500, {
                        Error: 'Could not find the check in the user object'
                      })
                    }
                  } else {
                    callback(400, {
                      Error: 'Could not find the specified user'
                    })
                  }
                })
              } else {
                callback(500, { Error: 'Could not delete the specified check' })
              }
            })
          } else {
            callback(403, { Error: 'Invalid token in header' })
          }
        })
      } else {
        callback(400, { Error: 'Could not find the specified check' })
      }
    })
  } else {
    callback(400, { Error: 'Missing or invalid required field' })
  }
}

module.exports = checks
