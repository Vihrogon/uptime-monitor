/* Primary file for the API */

/* Dependencies */
const server = require('./lib/server')
const workers = require('./lib/workers')
const cli = require('./lib/cli')

const app = {}

/* Init function */
app.init = async () => {
  /* Start the server */
  server.init()

  /* Start the workers */
  workers.init()

  /* Start the CLI, but make sure it starts last */
  setTimeout(() => {
    cli.init()
  }, 50)
}

/* Self invoke only if required directly */
if (require.main === module) {
  app.init()
}

module.exports = app

const DBI = require('./lib/databaseInterface')

/** Returns the value of a given position in the fibonacci sequence
 * @param {number} position - The position in the fibonacci sequence to calculate
 * @returns {number} - The result or -1 for error
 */
/* function fibonacci(position) {
  if (typeof position === 'number' && position > -1) {
    return fibonacciRecursion(position)
  } else {
    return -1
  }
  function fibonacciRecursion(position, result = 0, next = 1) {
    if (!position) {
      return result
    } else {
      return fibonacciRecursion(position - 1, next, result + next)
    }
  }
}
console.log(fibonacci(20)) */

/** better solutions:
 * map to key-value pairs, filter for single
 * interesting solution: .indexOf() === .lastIndexOf()
 * Reurn the first non-repeating caracter
 */
/* function fnrc1(str) {
  if (typeof str === 'string' && str.length) {
    let listOfChars = []
    let singleChars = []
    for (let char of str) {
      if (listOfChars.includes(char)) {
        singleChars = singleChars.filter((el) => {
          return char != el
        })
      } else {
        listOfChars.push(char)
        singleChars.push(char)
      }
    }
    if (singleChars.length) {
      return singleChars[0]
    } else {
      return 'no single characters'
    }
  } else {
    return 'not a correct string'
  }
}

// return the first non-repeating caracter
function fnrc2(str) {
  if (typeof str === 'string' && str.length) {
    let chars = {}
    let arr = str.split('')
    arr.forEach((value) => {
      let i = chars[value]
      chars[value] = i ? i + 1 : 1
    })
    for (let char of arr) {
      if (chars[char] === 1) {
        return char
      }
    }
    return 'no single caracters'
  } else {
    return 'invalid parameter'
  }
}

function fnrc3(str) {
  if (typeof str === 'string' && str.length) {
    for (let char of str.split('')) {
      if (str.indexOf(char) === str.lastIndexOf(char)) {
        return char
      }
    }
    return 'no single caracters'
  } else {
    return 'invalid parameter'
  }
}

const string = 'abcdefghigklmnopqrstuvwxyabcdefghigklmnopqrstuvwxyz'

let time, n
time = Date.now()
for (n = 0; n < 1000000; n++) {
  fnrc1(string)
}
console.log(`Time 1: ${Date.now() - time}`)
time = Date.now()
for (n = 0; n < 1000000; n++) {
  fnrc2(string)
}
console.log(`Time 2: ${Date.now() - time}`)
time = Date.now()
for (n = 0; n < 1000000; n++) {
  fnrc3(string)
}
console.log(`Time 3: ${Date.now() - time}`) */
