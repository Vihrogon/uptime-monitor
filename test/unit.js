/* Unit tests */

/* Dependencies */
const helpers = require('../lib/helpers')
const assert = require('assert')
const DBI = require('../lib/databaseInterface')
const LOG = require('../lib/logInterface')

const unit = {}

unit['helpers.hash should return a string'] = (done) => {
  let val = helpers.hash('test')
  assert.strictEqual(typeof val, 'string')
  done()
}

unit['LOG.list should callback a false error and an array of log names'] = (
  done
) => {
  LOG.list(true, (err, logFileNames) => {
    assert.strictEqual(err, false)
    assert.ok(logFileNames instanceof Array)
    assert.ok(logFileNames.length > 1)
    done()
  })
}

unit[
  'LOG.truncate should not trow if the log id does not exis, it should call an error instead'
] = (done) => {
  assert.doesNotThrow(() => {
    LOG.truncate('File name that does not exist', (err) => {
      assert.ok(err)
      done()
    })
  }, TypeError)
}

module.exports = unit
