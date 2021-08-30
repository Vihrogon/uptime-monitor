/* All the users route logic */

/* Dependancies */
const helpers = require('../helpers')
const DBI = require('../databaseInterface')

/* Users */
const users = {}

/* Users POST
Register new user
Required data: firstName, lastName, password, phone, tosAgreement
Optional data: none */
users.post = (data, callback) => {
  /* Check that all required fields are filled out and valid */
  let phone = helpers.validate.phone(data.payload.phone)
  let password = helpers.validate.password(data.payload.password)
  let firstName = helpers.validate.string(data.payload.firstName)
  let lastName = helpers.validate.string(data.payload.lastName)
  let tosAgreement = helpers.validate.boolean(data.payload.tosAgreement)

  if (password && phone && firstName && lastName && tosAgreement) {
    /* Make sure that the user doesnt already exist */
    DBI.read('users', phone, (err, userData) => {
      if (err) {
        // Hash the password
        let hashedPassword = helpers.hash(password)

        if (hashedPassword) {
          // Create the user object
          let userObject = {
            firstName,
            lastName,
            phone,
            tosAgreement,
            hashedPassword
          }

          // Store the user
          DBI.create('users', phone, userObject, (err) => {
            if (!err) {
              callback(200)
            } else {
              callback(500, { Error: 'Could not create the user' })
            }
          })
        } else {
          callback(500, { Error: 'Could not hash password' })
        }
      } else {
        // User already exists
        callback(400, { Error: 'A user with that phone number already exists' })
      }
    })
  } else {
    callback(400, { Error: 'Missing or invalid required fields' })
  }
}

/* Users GET
Required data: phone
Optional data: none */
users.get = (data, callback) => {
  /* Check that the phone number is valid */
  let phone = helpers.validate.phone(data.queryStringObject.phone)

  if (phone) {
    /* Get the token from the headers */
    let token =
      typeof data.headers.token === 'string' ? data.headers.token : false

    /* Verify that the given token is valid for the phone number */
    helpers.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        /* Lookup the user */
        DBI.read('users', phone, (err, userData) => {
          if (!err && userData) {
            /* remove the hashed password before returning it */
            delete userData.hashedPassword
            callback(200, userData)
          } else {
            callback(404)
          }
        })
      } else {
        callback(403, { Error: 'Invalid token in header' })
      }
    })
  } else {
    callback(400, { Error: 'Missing or invalid required field' })
  }
}

/* Users PUT
Required data: phone
Optional data: firstName, lastName, password (at least one must be specified)
Only let an authenticated user access their object */
users.put = (data, callback) => {
  /* Check for the required field */
  let phone = helpers.validate.phone(data.payload.phone)
  let password = helpers.validate.password(data.payload.password)
  let firstName = helpers.validate.string(data.payload.firstName)
  let lastName = helpers.validate.string(data.payload.lastName)

  /* Error if the phone is invalid */
  if (phone) {
    /* Error if nothing is send to update */
    if (firstName || lastName || password) {
      /* Get the token from the headers */
      let token =
        typeof data.headers.token === 'string' ? data.headers.token : false

      /* Verify that the given token is valid for the phone number */
      helpers.verifyToken(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {
          /* Lookup the user */
          DBI.read('users', phone, (err, userData) => {
            if (!err && userData) {
              /* Update the necessary fields */
              if (firstName) {
                userData.firstName = firstName
              }
              if (lastName) {
                userData.lastName = lastName
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password)
              }

              /* Store the new updates */
              DBI.update('users', phone, userData, (err) => {
                if (!err) {
                  callback(200)
                } else {
                  console.log(err)
                  callback(500, { Error: 'Could not update the user' })
                }
              })
            } else {
              callback(400, { Error: 'The specified user does not exist' })
            }
          })
        } else {
          callback(403, { Error: 'Invalid token in header' })
        }
      })
    } else {
      callback(400, { Error: 'Missing fields to update' })
    }
  } else {
    callback(400, { Error: 'Missing or invalid required field' })
  }
}

/* Users DELETE
Required field: phone
Only let an authenticated user delete their object */
users.delete = (data, callback) => {
  /* Check that the phone number is valid */
  let phone = helpers.validate.phone(data.queryStringObject.phone)
  if (phone) {
    /* Get the token from the headers */
    let token =
      typeof data.headers.token === 'string' ? data.headers.token : false

    /* Verify that the given token is valid for the phone number */
    helpers.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        DBI.read('users', phone, (err, userData) => {
          if (!err && userData) {
            DBI.delete('users', phone, (err) => {
              if (!err) {
                /* If the user was deleted successfully also delete all of his checks */
                let userChecks =
                  typeof userData.checks === 'object' &&
                  userData.checks instanceof Array
                    ? userData.checks
                    : false
                let checksToDelete = userChecks.length
                if (checksToDelete) {
                  let checksDeleted = 0
                  let deletionErrors = false
                  /* Loop through the checks */
                  userChecks.forEach((checkId) => {
                    /* Delete the check */
                    DBI.delete('checks', checkId, (err) => {
                      if (err) {
                        deletionErrors = true
                      }
                      checksDeleted++
                      if (checksDeleted === checksToDelete) {
                        if (!deletionErrors) {
                          callback(200)
                        } else {
                          callback(500, {
                            Error:
                              'Errors encoutered while attempting to delete the checks'
                          })
                        }
                      }
                    })
                  })
                } else {
                  callback(204)
                }
              } else {
                callback(500, { Error: 'Could not delete the specified user' })
              }
            })
          } else {
            callback(400, { Error: 'Could not find the specified user' })
          }
        })
      } else {
        callback(403, { Error: 'Invalid token in header' })
      }
    })
    /* Lookup the user */
  } else {
    callback(400, { Error: 'Missing or invalid required field' })
  }
}

/* Export */
module.exports = users
