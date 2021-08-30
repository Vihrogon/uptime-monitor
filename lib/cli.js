/* CLI-related tasks */

/* Dependencies */
const readline = require('readline')
const util = require('util')
const debug = util.debuglog('cli')
const events = require('events')
class _events extends events {}
const e = new _events()
const helpers = require('./helpers')
const os = require('os')
const v8 = require('v8')
const DBI = require('./databaseInterface')
const LOG = require('./logInterface')

/* Instantiate the CLI module object */
const cli = {}

/* Input handlers */
e.on('man', (str) => {
  cli.responders.help()
})
e.on('help', (str) => {
  cli.responders.help()
})
e.on('exit', (str) => {
  cli.responders.exit()
})
e.on('stats', (str) => {
  cli.responders.stats()
})
e.on('list users', (str) => {
  cli.responders.listUsers()
})
e.on('more user info', (str) => {
  cli.responders.moreUserInfo(str)
})
e.on('list checks', (str) => {
  cli.responders.listChecks(str)
})
e.on('more check info', (str) => {
  cli.responders.moreCheckInfo(str)
})
e.on('list logs', (str) => {
  cli.responders.listLogs()
})
e.on('more log info', (str) => {
  cli.responders.moreLogInfo(str)
})

/* Responders object */
cli.responders = {}

cli.responders.help = () => {
  const commands = {
    exit: 'Kill the CLI (and the rest of the application)',
    man: 'Show this help page',
    help: 'Alias of the "man" command',
    stats:
      'Get statistics on the underlying operating system and resource utilization',
    'list users': 'Show a list of all the registered users in the system',
    'more user info --{userId}': 'Show details of a specific user',
    'list checks ?--up|down':
      'Show a list of all the active checks in the system, including their state',
    'more check info --{checkId}': 'Show details of a specified check',
    'list logs':
      'Show a list of all the log files available to be read (compressed only)',
    'more log info --{fileName}': 'Show details of a specified log file'
  }

  cli.line('-')
  cli.center('CLI MANUAL')
  cli.line('-')
  cli.line(2)

  for (let key in commands) {
    if (commands.hasOwnProperty(key)) {
      let line = '\x1b[33m' + key + '\x1b[0m'
      let padding = 60 - line.length
      line += ' '.repeat(padding) + commands[key]
      console.log(line)
      cli.line()
    }
  }

  cli.line()
  cli.line('-')
}

cli.responders.exit = () => {
  process.exit(0)
}

cli.responders.stats = () => {
  const stats = {
    'Load Avarage': os.loadavg().join(' '),
    'CPU Count': os.cpus().length,
    'Free Memory': os.freemem(),
    'Current Malloced Memory': v8.getHeapStatistics().malloced_memory,
    'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
    'Allocated Heap Usage (%)': Math.round(
      100 *
        (v8.getHeapStatistics().total_heap_size /
          v8.getHeapStatistics().heap_size_limit)
    ),
    'Available Heap Allocated (%)': Math.round(
      100 *
        (v8.getHeapStatistics().used_heap_size /
          v8.getHeapStatistics().total_heap_size)
    ),
    Uptime: os.uptime() + ' seconds'
  }
  cli.line('-')
  cli.center('SYSTEM STATISTICS')
  cli.line('-')
  cli.line(2)

  for (let key in stats) {
    if (stats.hasOwnProperty(key)) {
      let line = '\x1b[33m' + key + '\x1b[0m'
      let padding = 60 - line.length
      line += ' '.repeat(padding) + stats[key]
      console.log(line)
      cli.line()
    }
  }

  cli.line()
  cli.line('-')
}

cli.responders.listUsers = () => {
  DBI.list('users', (err, userIds) => {
    if (!err && userIds && userIds.length) {
      cli.line()
      userIds.forEach((userId) => {
        DBI.read('users', userId, (err, userData) => {
          if (!err && userData) {
            let numberOfChecks = userData.checks?.length
              ? userData.checks.length
              : 0
            let line = `Name: ${userData.firstName} ${userData.lastName}, Phone: ${userData.phone}, Checks: ${numberOfChecks}`
            console.log(line)
            cli.line()
          }
        })
      })
    }
  })
}

cli.responders.moreUserInfo = (str) => {
  let userId = helpers.validate.string(str.split('--')[1])
  if (userId) {
    DBI.read('users', userId, (err, userData) => {
      if (!err && userData) {
        delete userData.hashedPassword

        cli.line()
        console.dir(userData, { colors: true })
        cli.line()
      }
    })
  }
}

/**  */
cli.responders.listChecks = (str) => {
  DBI.list('checks', (err, checkIds) => {
    if (!err && checkIds && checkIds.length) {
      cli.line()
      checkIds.forEach((checkId) => {
        DBI.read('checks', checkId, (err, checkData) => {
          if (!err && checkData) {
            let flag = helpers.validate.string(str.split('--')[1])
            if (
              !flag ||
              checkData.state === flag ||
              (flag === 'down' && checkData.state === undefined)
            ) {
              let line = `ID: ${
                checkData.id
              }, Method: ${checkData.method.toUpperCase()}, URL: ${
                checkData.protocol
              }://${checkData.url}, State: ${checkData.state}`
              console.log(line)
              cli.line()
            }
          }
        })
      })
    }
  })
}

cli.responders.moreCheckInfo = (str) => {
  let checkId = helpers.validate.string(str.split('--')[1])
  if (checkId) {
    DBI.read('checks', checkId, (err, checkData) => {
      if (!err && checkData) {
        cli.line()
        console.dir(checkData, { colors: true })
        cli.line()
      }
    })
  }
}

cli.responders.listLogs = () => {
  LOG.list(true, (err, logFileNames) => {
    if (!err && logFileNames && logFileNames.length) {
      cli.line()
      logFileNames.forEach((logFileName) => {
        if (logFileName.includes('-')) {
          console.log(logFileName)
          cli.line()
        }
      })
    }
  })
}

cli.responders.moreLogInfo = (str) => {
  let logFileName = helpers.validate.string(str.split('--')[1])
  if (logFileName) {
    cli.line()
    LOG.decompress(logFileName, (err, strData) => {
      if (!err && strData) {
        let arr = strData.split('\n')
        arr.forEach((jsonStr) => {
          let logObj = helpers.parseJsonToObject(jsonStr)
          if (logObj && JSON.stringify(logObj) !== '{}') {
            console.dir(logObj, { colors: true })
            cli.line()
          }
        })
      }
    })
  }
}

/** To format output line by line.
 * If called with only one param, defaults to a second value based on type
 * @param {(number|string)} lines - how many lines or a char
 * @param {string} [char=' '] - how to fill them
 * @return {void}
 */
cli.line = function (lines, char) {
  if (arguments.length === 1) {
    if (typeof lines === 'number') {
      char = ' '
    } else {
      char = lines
      lines = 1
    }
  }
  lines = typeof lines === 'number' && lines ? lines : 1
  char = typeof char === 'string' && char.length === 1 ? char : ' '
  let width = process.stdout.columns
  let result = char.repeat(width)
  for (let i = 0; i < lines; i++) {
    console.log(result)
  }
}

/** To format output with centered text
 * @param {string} str - display text
 * @return {void}
 */
cli.center = (str) => {
  let width = process.stdout.columns
  let padding = ~~((width - str.length) / 2)
  let line = ' '.repeat(padding) + str
  console.log(line)
}

/* Input processor */
cli.processInput = (str) => {
  str = helpers.validate.string(str)
  if (str) {
    /* Codify the unique strings that identify the unique questions allowed to be asked */
    let uniqueInputs = [
      'man',
      'help',
      'exit',
      'stats',
      'list users',
      'more user info',
      'list checks',
      'more check info',
      'list logs',
      'more log info'
    ]

    /* Go through the possible inputs and emit an event when a match is found */
    let matchFound = false
    let counter = 0
    uniqueInputs.some((input) => {
      if (str.toLowerCase().includes(input)) {
        matchFound = true
        /* Emit an event matching the unique input and include the full string given */
        e.emit(input, str)
        return true
      }
    })
    if (!matchFound) {
      console.log('\x1b[31m%s\x1b[0m', 'command not recognised')
    }
  }
}

/* Not a REPL on purpose */
/* Init script */
cli.init = () => {
  /* Send the start message to the console in dark blue */
  console.log('\x1b[34m%s\x1b[0m', 'The CLI is running...')

  /* Start the interface */
  let _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
  })

  /* Create an initial prompt */
  _interface.prompt()

  /* Handle each line of input separately */
  _interface.on('line', (str) => {
    /* Send to the input processor */
    cli.processInput(str)
  })

  /* Re-initialize the prompt */
  _interface.prompt()

  /* If the user stops the CLI, kill the associated prodess */
  _interface.on('close', () => {
    process.exit(0)
  })
}

/* Export the module */
module.exports = cli
