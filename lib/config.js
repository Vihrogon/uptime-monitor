/* Create and export configuration variables
commands to use in windows
SET NODE_ENV=staging
node index
*/

/* Container for all the environments */
let environments = {}

/* Staging (default) environment */
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'secret',
  maxChecks: 5,
  twilio: {
    accountID: 'ACb32d411ad7fe886aac54c665d25e5c5d',
    authToken: '9455e3eb3109edc12e3d8c92768f7a67',
    fromPhone: '+15005550006'
  },
  templateGlobals: {
    appName: 'WHATSUPDOG',
    companyName: 'Vihrogon, Inc',
    yearCreated: '2021',
    baseUrl: 'http://localhost:3000'
  }
}

/* Production environment */
environments.production = {
  httpPort: 8000,
  httpsPort: 443,
  envName: 'production',
  hashingSecret: 'secret',
  maxchecks: 5,
  twilio: {
    accountID: 'ACb32d411ad7fe886aac54c665d25e5c5d',
    authToken: '9455e3eb3109edc12e3d8c92768f7a67',
    fromPhone: '+15005550006'
  },
  templateGlobals: {
    appName: 'WHATSUPDOG',
    companyName: 'Vihrogon, Inc',
    yearCreated: '2021',
    baseUrl: 'http://localhost:3000'
  }
}

/* Testing environment */
environments.testing = {
  httpPort: 4000,
  httpsPort: 4001,
  envName: 'testing',
  hashingSecret: 'secret',
  maxchecks: 5,
  twilio: {
    accountID: 'ACb32d411ad7fe886aac54c665d25e5c5d',
    authToken: '9455e3eb3109edc12e3d8c92768f7a67',
    fromPhone: '+15005550006'
  },
  templateGlobals: {
    appName: 'WHATSUPDOG',
    companyName: 'Vihrogon, Inc',
    yearCreated: '2021',
    baseUrl: 'http://localhost:3000'
  }
}

/* Determine which environment was passed as a command-line argument */
let currentEnvironment =
  typeof process.env.NODE_ENV === 'string'
    ? process.env.NODE_ENV.toLowerCase()
    : ''

/* Check that the current environment is one of the environments above.
If not, default to staging */
let environmentToExport =
  typeof environments[currentEnvironment] == 'object'
    ? environments[currentEnvironment]
    : environments.staging

/* Export the module */
module.exports = environmentToExport
