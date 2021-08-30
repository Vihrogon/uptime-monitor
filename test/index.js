/* This is the test runner */

/* Override the environment */
process.env.NODE_ENV = 'testing'

/** Object initialization and application logic for the test runner */
const app = {}

/** Container for the tests */
app.tests = {}

app.tests.units = require('./unit')
app.tests.api = require('./api')

/** Used to count the number of sub-tests in all test categories
 * @return {number}
 */
app.countTests = () => {
  let counter = 0
  for (let key in app.tests) {
    if (app.tests.hasOwnProperty(key)) {
      let subTests = app.tests[key]
      for (let testName in subTests) {
        if (subTests.hasOwnProperty(testName)) {
          counter++
        }
      }
    }
  }
  return counter
}

/** Prints to console the results of running the tests
 * @param {number} limit - number of total tests
 * @param {number} successes - number of successful tests
 * @param {Array} errors - list of error objects
 * @returns {void}
 */
app.produceTestReport = (limit, successes, errors) => {
  console.log('---------BEGIN TEST REPORT----------')
  console.log('')
  console.log('Total tests: ', limit)
  console.log('Passed: ', successes)
  console.log('Failed: ', errors.length)
  console.log('')

  if (errors.length) {
    console.log('---------BEGIN ERROR DETAILS----------')
    console.log('')
    errors.forEach((testError) => {
      console.log('\x1b[31m%s\x1b[0m', testError.name)
      console.log(testError.error)
      console.log('')
    })
    console.log('')
    console.log('---------END ERROR DETAILS----------')
  }

  console.log('')
  console.log('---------END TEST REPORT----------')
  process.exit(0)
}

/** Called when the file is ran, loops throught and performs all sub-test
 * @returns {void}
 */
app.runTests = () => {
  let errors = []
  let successes = 0
  let limit = app.countTests()
  let counter = 0
  for (let key in app.tests) {
    if (app.tests.hasOwnProperty(key)) {
      let subTests = app.tests[key]
      for (let testName in subTests) {
        if (subTests.hasOwnProperty(testName)) {
          ;(() => {
            let tmpTestName = testName
            let testValue = subTests[testName]
            try {
              testValue(() => {
                console.log('\x1b[32m%s\x1b[0m', tmpTestName)
                counter++
                successes++
                if (counter === limit) {
                  app.produceTestReport(limit, successes, errors)
                }
              })
            } catch (e) {
              errors.push({
                name: testName,
                error: e
              })
              console.log('\x1b[31m%s\x1b[0m', tmpTestName)
              counter++
              if (counter === limit) {
                app.produceTestReport(limit, successes, errors)
              }
            }
          })()
        }
      }
    }
  }
}

app.runTests()
