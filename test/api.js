/* API tests */

/* Dependencies */
const app = require('../index')
const assert = require('assert')
const http = require('http')
const config = require('../lib/config')
const helpers = require('../lib/helpers')

const api = {}

api['app.init should start withoud trowing'] = (done) => {
  assert.doesNotThrow(() => {
    app.init().then(() => {
      done()
    })
  }, TypeError)
}

api['A random path should respond to GET with 404'] = (done) => {
  helpers.makeGetRequest('/this/path/should/not/exist', (res) => {
    assert.strictEqual(res.statusCode, 404)
    done()
  })
}

api['/ping should respond to GET with 200'] = (done) => {
  helpers.makeGetRequest('/ping', (res) => {
    assert.strictEqual(res.statusCode, 200)
    done()
  })
}

api['/api/users should respond to GET with 400'] = (done) => {
  helpers.makeGetRequest('/api/users', (res) => {
    assert.strictEqual(res.statusCode, 400)
    done()
  })
}

module.exports = api
