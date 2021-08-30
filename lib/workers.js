/* Worker-related tasks */

/* Dependencies */
const http = require('http')
const https = require('https')
const DBI = require('./databaseInterface')
const LOG = require('./logInterface')
const helpers = require('./helpers')
const util = require('util')
const debug = util.debuglog('workers')

/* Instantiate the worker object */
const workers = {}

/** Lookup all checks, read their data and send them to a validator */
workers.readAllChecks = () => {
  DBI.list('checks', (err, checks) => {
    if (!err && checks && checks.length) {
      checks.forEach((check) => {
        DBI.read('checks', check, (err, checkData) => {
          if (!err && checkData) {
            workers.validateCheckData(checkData)
          } else {
            debug("Error reading one of the check's data")
          }
        })
      })
    } else {
      debug('Error: Could not find any checks to process')
    }
  })
}

/* Sanity-check the check data */
workers.validateCheckData = (checkData) => {
  checkData = helpers.validate.object(checkData)
  checkData.id = helpers.validate.id(checkData.id)
  checkData.userPhone = helpers.validate.phone(checkData.userPhone)
  checkData.protocol = helpers.validate.protocol(checkData.protocol)
  checkData.url = helpers.validate.string(checkData.url)
  checkData.method = helpers.validate.method(checkData.method)
  checkData.successCodes = helpers.validate.successCodes(checkData.successCodes)
  checkData.timeoutSeconds = helpers.validate.timeoutSeconds(
    checkData.timeoutSeconds
  )
  /* Set the keys that mey not be set if the workers have never seen this check */
  checkData.state = helpers.validate.state(checkData.state)
  checkData.lastChecked = helpers.validate.lastChecked(checkData.lastChecked)

  /* If all the checks pass, pass the data along to the next step in the process */
  if (
    checkData.id &&
    checkData.userPhone &&
    checkData.protocol &&
    checkData.url &&
    checkData.method &&
    checkData.successCodes &&
    checkData.timeoutSeconds
  ) {
    workers.performCheck(checkData)
  } else {
    debug('Error: The check is not properly formatted')
  }
}

/* Perform the check, send the the check data and the outcome of the check process to the next process */
workers.performCheck = (checkData) => {
  /* Prepare the initial check outcome */
  let checkOutcome = {
    error: false,
    responseCode: false
  }
  /* Mark that the outcome has not been sent yet */
  let outcomeSent = false
  /* Parse the host name and the path out of the check data */
  //let parsedUrl = new URL(`${checkData.protocol}://${checkData.url}`)
  let parsedUrl = new URL(checkData.protocol + '://' + checkData.url)
  let hostname = parsedUrl.hostname
  let path = parsedUrl.pathname + parsedUrl.search

  /* Construct the request */
  let requestDetails = {
    protocol: checkData.protocol + ':',
    method: checkData.method.toUpperCase(),
    timeout: checkData.timeoutSeconds * 1000,
    hostname,
    path
  }

  /* Instantiate the request object using the http or https module */
  let _moduleToUse = checkData.protocol === 'http' ? http : https
  let req = _moduleToUse.request(requestDetails, (res) => {
    /* Get the status of the send request */
    let status = res.statusCode
    /* Update the check outcome and pass the data along */
    checkOutcome.responseCode = status
    if (!outcomeSent) {
      workers.processCheckOutcome(checkData, checkOutcome)
      outcomeSent = true
    }
  })
  /* Bind to the error event so it doesn't get trown */
  req.on('error', (e) => {
    /* Update the checkOutcome and pass the data along */
    checkOutcome.error = {
      error: true,
      value: e
    }
    if (!outcomeSent) {
      workers.processCheckOutcome(checkData, checkOutcome)
      outcomeSent = true
    }
  })
  /* Bind to the timeout event */
  req.on('error', (e) => {
    /* Update the checkOutcome and pass the data along */
    checkOutcome.error = {
      error: true,
      value: 'timeout'
    }
    if (!outcomeSent) {
      workers.processCheckOutcome(checkData, checkOutcome)
      outcomeSent = true
    }
  })
  /* End the request */
  req.end()
}

/* Process the check outcome and update the check data if needed, trigger an alert if needed
Special logic to accomodate for checks that have never been tested before */
workers.processCheckOutcome = (checkData, checkOutcome) => {
  /* Decide if the check is up or down */
  let state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    checkData.successCodes.includes(checkOutcome.responseCode)
      ? 'up'
      : 'down'
  /* Decide if an alert is warranted */
  let alertWarranted =
    checkData.lastChecked && checkData.state !== state ? true : false

  /* Log the outcome of the check */
  let timeOfCheck = Date.now()
  workers.log({ checkData, checkOutcome, state, alertWarranted, timeOfCheck })

  /* Update the check data */
  let newCheckData = checkData
  newCheckData.state = state
  newCheckData.lastChecked = timeOfCheck

  /* Save the updates */
  DBI.update('checks', newCheckData.id, newCheckData, (err) => {
    if (!err) {
      // Send the new check data to the next step if needed
      if (alertWarranted) {
        workers.alertUserToStatusChange(newCheckData)
      } else {
        debug('Check outcome has not changed, no alert needed')
      }
    } else {
      debug('Error trying to save updates to one of the checks')
    }
  })
}

/* Alert the user as to a change in the check status */
workers.alertUserToStatusChange = (checkData) => {
  let msg = `Alert: Your check for ${checkData.method.toUpperCase()} ${
    checkData.protocol
  }://${checkData.url} is currently ${checkData.state}`
  helpers.twilioSendSMS(checkData.userPhone, msg, (err) => {
    if (!err) {
      debug(
        'Success: User was alerted via sms to a status change in their check'
      )
    } else {
      debug(
        'Error: Could not send sms alert to user who had a state change in their check'
      )
    }
  })
}

/* Writes the log to file */
workers.log = (obj) => {
  let string = JSON.stringify(obj)

  LOG.append(obj.checkData.id, string, (err) => {
    if (!err) {
      debug('Logging to file succeeded')
    } else {
      debug('Logging to file failed')
    }
  })
}

/* Rotate (Compress) the log files */
workers.rotateLogs = () => {
  /* List all the non-compressed log files */
  LOG.list(false, (err, logs) => {
    if (!err && logs && logs.length) {
      logs.forEach((logName) => {
        /* Compress the data to a new file */
        let logId = logName.replace('.log', '')
        let newField = logId + '_' + Date.now()
        LOG.compress(logId, newField, (err) => {
          if (!err) {
            /* truncate the log */
            LOG.truncate(logId, (err) => {
              if (!err) {
                debug('Success truncating log files')
              } else {
                debug('Error truncating log files')
              }
            })
          } else {
            debug('Error compressing one of the log files')
          }
        })
      })
    } else {
      debug('Error: Could not find any logs to compress')
    }
  })
}

/** Loop through all tokens and delete the expired ones */
workers.clearExpiredTokens = () => {
  DBI.list('tokens', (err, tokenNames) => {
    if (!err && tokenNames && tokenNames.length) {
      tokenNames.forEach((tokenName) => {
        DBI.read('tokens', tokenName, (err, tokenData) => {
          if (!err && tokenData) {
            if (tokenData.expires < Date.now()) {
              DBI.delete('tokens', tokenName, (err) => {
                if (!err) {
                  debug('Successfully deleted expired token')
                } else {
                  debug('Failed to delete expired token')
                }
              })
            }
          } else {
            debug('Error: Could not read file')
          }
        })
      })
    } else {
      debug('Something whent wrong while trying to list tokens directory')
    }
  })
}

/* General timer */
workers.loop = () => {
  /* Call workers */
  setInterval(() => {
    workers.readAllChecks()
  }, 1000 * 60)
  /* Call log compression every day*/
  setInterval(() => {
    workers.rotateLogs()
  }, 1000 * 60 * 60 * 24)

  /* Clear expired tokens every hour */
  setInterval(() => {
    workers.clearExpiredTokens()
  }, 1000 * 60 * 60)
}

/* Init script */
workers.init = () => {
  /* Send to console in yellow */
  console.log('\x1b[33m%s\x1b[0m', 'Background workers are running')
  /* Execute all the checks immediately */
  workers.readAllChecks()
  /* Compress all the logs immediately */
  workers.rotateLogs()

  workers.clearExpiredTokens()
  /* Call the loop */
  workers.loop()
}

/* Export the module */
module.exports = workers
