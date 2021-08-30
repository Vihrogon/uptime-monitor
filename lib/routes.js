/* Request handlers */

/* Dependencies */
const users = require('./routes/users')
const tokens = require('./routes/tokens')
const checks = require('./routes/checks')
const helpers = require('./helpers')

/* Define the handlers */
const routes = {}

/* HTML Routes */

routes.index = (data, callback) => {
  /* Reject any request that isn't GET */
  if (data.method === 'get') {
    /* Prepare Data for interpolation */
    let templateData = {
      'head.title': 'Uptime Monitor',
      'head.description': 'HTTP uptime monitor with sms sending',
      'body.class': 'index'
    }

    helpers.getTemplate('index', templateData, (err, str) => {
      if (!err && str) {
        /* Add the page template */
        helpers.pageWrapper(str, templateData, (err, html) => {
          if (!err && html) {
            callback(200, html, 'html')
          } else {
            callback(500, undefined, 'html')
          }
        })
      } else {
        callback(500, undefined, 'html')
      }
    })
  } else {
    callback(405, undefined, 'html')
  }
}

/* Create Account */
routes.accountCreate = (data, callback) => {
  /* Reject any request that isn't GET */
  if (data.method === 'get') {
    /* Prepare Data for interpolation */
    let templateData = {
      'head.title': 'Create an account',
      'head.description': 'Signup to our services',
      'body.class': 'accountCreate'
    }

    helpers.getTemplate('accountCreate', templateData, (err, str) => {
      if (!err && str) {
        /* Add the page template */
        helpers.pageWrapper(str, templateData, (err, html) => {
          if (!err && html) {
            callback(200, html, 'html')
          } else {
            callback(500, undefined, 'html')
          }
        })
      } else {
        callback(500, undefined, 'html')
      }
    })
  } else {
    callback(405, undefined, 'html')
  }
}

/* Create Session */
routes.sessionCreate = (data, callback) => {
  /* Reject any request that isn't GET */
  if (data.method === 'get') {
    /* Prepare Data for interpolation */
    let templateData = {
      'head.title': 'Login to your account',
      'head.description': 'Enter your phone number and password',
      'body.class': 'sessionCreate'
    }

    helpers.getTemplate('sessionCreate', templateData, (err, str) => {
      if (!err && str) {
        /* Add the page template */
        helpers.pageWrapper(str, templateData, (err, html) => {
          if (!err && html) {
            callback(200, html, 'html')
          } else {
            callback(500, undefined, 'html')
          }
        })
      } else {
        callback(500, undefined, 'html')
      }
    })
  } else {
    callback(405, undefined, 'html')
  }
}

/* Session has been deleted */
routes.sessionDeleted = (data, callback) => {
  /* Reject any request that isn't GET */
  if (data.method === 'get') {
    /* Prepare Data for interpolation */
    let templateData = {
      'head.title': 'Logged out',
      'head.description': 'You have been logged out of your account',
      'body.class': 'sessionDeleted'
    }

    helpers.getTemplate('sessionDeleted', templateData, (err, str) => {
      if (!err && str) {
        /* Add the page template */
        helpers.pageWrapper(str, templateData, (err, html) => {
          if (!err && html) {
            callback(200, html, 'html')
          } else {
            callback(500, undefined, 'html')
          }
        })
      } else {
        callback(500, undefined, 'html')
      }
    })
  } else {
    callback(405, undefined, 'html')
  }
}

/* Edit your account */
routes.accountEdit = (data, callback) => {
  /* Reject any request that isn't GET */
  if (data.method === 'get') {
    /* Prepare Data for interpolation */
    let templateData = {
      'head.title': 'Account Settings',
      'body.class': 'accountEdit'
    }

    helpers.getTemplate('accountEdit', templateData, (err, str) => {
      if (!err && str) {
        /* Add the page template */
        helpers.pageWrapper(str, templateData, (err, html) => {
          if (!err && html) {
            callback(200, html, 'html')
          } else {
            callback(500, undefined, 'html')
          }
        })
      } else {
        callback(500, undefined, 'html')
      }
    })
  } else {
    callback(405, undefined, 'html')
  }
}

/* Account has been deleted */
routes.accountDeleted = (data, callback) => {
  /* Reject any request that isn't GET */
  if (data.method === 'get') {
    /* Prepare Data for interpolation */
    let templateData = {
      'head.title': 'Account Deleted',
      'head.description': 'Your account has been deleted',
      'body.class': 'accountDeleted'
    }

    helpers.getTemplate('accountDeleted', templateData, (err, str) => {
      if (!err && str) {
        /* Add the page template */
        helpers.pageWrapper(str, templateData, (err, html) => {
          if (!err && html) {
            callback(200, html, 'html')
          } else {
            callback(500, undefined, 'html')
          }
        })
      } else {
        callback(500, undefined, 'html')
      }
    })
  } else {
    callback(405, undefined, 'html')
  }
}

/* Create a new check */
routes.checksCreate = (data, callback) => {
  /* Reject any request that isn't GET */
  if (data.method === 'get') {
    /* Prepare Data for interpolation */
    let templateData = {
      'head.title': 'Create a new check',
      /* 'head.description': 'Your account has been deleted', */
      'body.class': 'checksCreate'
    }

    helpers.getTemplate('checksCreate', templateData, (err, str) => {
      if (!err && str) {
        /* Add the page template */
        helpers.pageWrapper(str, templateData, (err, html) => {
          if (!err && html) {
            callback(200, html, 'html')
          } else {
            callback(500, undefined, 'html')
          }
        })
      } else {
        callback(500, undefined, 'html')
      }
    })
  } else {
    callback(405, undefined, 'html')
  }
}

/* View all check */
routes.checksList = (data, callback) => {
  /* Reject any request that isn't GET */
  if (data.method === 'get') {
    /* Prepare Data for interpolation */
    let templateData = {
      'head.title': 'Dashboard',
      /* 'head.description': 'Your account has been deleted', */
      'body.class': 'checksList'
    }

    helpers.getTemplate('checksList', templateData, (err, str) => {
      if (!err && str) {
        /* Add the page template */
        helpers.pageWrapper(str, templateData, (err, html) => {
          if (!err && html) {
            callback(200, html, 'html')
          } else {
            callback(500, undefined, 'html')
          }
        })
      } else {
        callback(500, undefined, 'html')
      }
    })
  } else {
    callback(405, undefined, 'html')
  }
}

/* Edit a check */
routes.checksEdit = (data, callback) => {
  /* Reject any request that isn't GET */
  if (data.method === 'get') {
    /* Prepare Data for interpolation */
    let templateData = {
      'head.title': 'Check details',
      /* 'head.description': 'Your account has been deleted', */
      'body.class': 'checksEdit'
    }

    helpers.getTemplate('checksEdit', templateData, (err, str) => {
      if (!err && str) {
        /* Add the page template */
        helpers.pageWrapper(str, templateData, (err, html) => {
          if (!err && html) {
            callback(200, html, 'html')
          } else {
            callback(500, undefined, 'html')
          }
        })
      } else {
        callback(500, undefined, 'html')
      }
    })
  } else {
    callback(405, undefined, 'html')
  }
}

/* Favicon */
routes.favicon = (data, callback) => {
  if (data.method === 'get') {
    helpers.getStaticAsset('favicon.ico', (err, data) => {
      if (!err && data) {
        callback(200, data, 'favicon')
      } else {
        callback(500)
      }
    })
  } else {
    callback(405, undefined, 'html')
  }
}

/* Public assets */
routes.public = (data, callback) => {
  if (data.method === 'get') {
    let trimmedAssetName = data.trimmedPath.replace('public/', '').trim()
    if (trimmedAssetName.length) {
      helpers.getStaticAsset(trimmedAssetName, (err, data) => {
        if (!err && data) {
          /* Determine the content type (default to plain text) */
          let contentType = 'plain'
          if (trimmedAssetName.includes('.css')) {
            contentType = 'css'
          } else if (trimmedAssetName.includes('.js')) {
            contentType = 'js'
          } else if (trimmedAssetName.includes('.png')) {
            contentType = 'png'
          } else if (trimmedAssetName.includes('.jpg')) {
            contentType = 'jpg'
          } else if (trimmedAssetName.includes('.ico')) {
            contentType = 'ico'
          }
          callback(200, data, contentType)
        } else {
          callback(500)
        }
      })
    } else {
      callback(404)
    }
  } else {
    callback(405, undefined, 'html')
  }
}

/* JSON API Routes */

/** Example error */
routes.exampleError = (data, callback) => {
  let error = new Error('This is an example error')
  throw error
}

/* Not found handler */
routes.notFound = (data, callback) => {
  callback(404)
}

/* Ping */
routes.ping = (data, callback) => {
  callback(200)
}

/* Users */
routes.users = (data, callback) => {
  let acceptableMethods = ['get', 'post', 'put', 'delete']
  if (acceptableMethods.includes(data.method)) {
    users[data.method](data, callback)
  } else {
    callback(405)
  }
}

/* Tokens */
routes.tokens = (data, callback) => {
  let acceptableMethods = ['get', 'post', 'put', 'delete']
  if (acceptableMethods.includes(data.method)) {
    tokens[data.method](data, callback)
  } else {
    callback(405)
  }
}

/* Checks */
routes.checks = (data, callback) => {
  let acceptableMethods = ['get', 'post', 'put', 'delete']
  if (acceptableMethods.includes(data.method)) {
    checks[data.method](data, callback)
  } else {
    callback(405)
  }
}

/* Export the module */
module.exports = routes
