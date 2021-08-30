/* Library for CRUD operations to file*/

const fs = require('fs')
const fsp = fs.promises
const path = require('path')
const helpers = require('./helpers')

/** Container for the database interface module */
const database = {}

/** Base directory of the data folder */
database.baseDir = path.join(__dirname, '/../.database/')

/* List all files in a directory */
database.list = (dir, callback) => {
  fs.readdir(database.baseDir + dir + '/', (err, data) => {
    if (!err && data && data.length) {
      let trimmmedFileNames = []
      data.forEach((fileName) => {
        trimmmedFileNames.push(fileName.replace('.json', ''))
      })
      callback(false, trimmmedFileNames)
    } else {
      callback(err, data)
    }
  })
}

/** Create a file at the specified path with given file name and writes data to it */
database.create = (dir, file, data, callback) => {
  fs.open(
    database.baseDir + dir + '/' + file + '.json',
    'wx',
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        let stringData = JSON.stringify(data)

        fs.writeFile(fileDescriptor, stringData, (err) => {
          if (!err) {
            fs.close(fileDescriptor, (err) => {
              if (!err) {
                callback(false)
              } else {
                callback('Error closing new file')
              }
            })
          } else {
            callback('Error writing to new file')
          }
        })
      } else {
        callback('Could not create new file, it may already exist')
      }
    }
  )
}

/* Read data from a file */
database.read = (dir, file, callback) => {
  fs.readFile(
    database.baseDir + dir + '/' + file + '.json',
    'utf8',
    (err, data) => {
      if (!err && data) {
        let parsedData = helpers.parseJsonToObject(data)
        callback(false, parsedData)
      } else {
        callback(err, data)
      }
    }
  )
}

/* Update data in an existing file */
database.update = (dir, file, data, callback) => {
  // Try to open the file for writing
  fs.open(
    database.baseDir + dir + '/' + file + '.json',
    'r+',
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // Convert data to string
        let stringData = JSON.stringify(data)

        // Truncate the file
        fs.ftruncate(fileDescriptor, (err) => {
          if (!err) {
            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
              if (!err) {
                fs.close(fileDescriptor, (err) => {
                  if (!err) {
                    callback(false)
                  } else {
                    callback('Error closing the file')
                  }
                })
              } else {
                callback('Error writing to existing file')
              }
            })
          } else {
            callback('Error truncating file')
          }
        })
      } else {
        callback('Could not open the file for updating, it may not exist yet')
      }
    }
  )
}

/* Delete a file */
database.delete = (dir, file, callback) => {
  fs.unlink(database.baseDir + dir + '/' + file + '.json', (err) => {
    if (!err) {
      callback(false)
    } else {
      callback('Error deleting file')
    }
  })
}

module.exports = database

/** Lists all file names in a given directory
 * @param {string} dir - Directory
 * @returns {Promise<string[]>} Promise
 */
/* database.list = async (dir) => {
  let fileNames = await fsp.readdir(database.baseDir + dir + '/')
  return fileNames.map((fileName) => {
    return fileName.replace('.json', '')
  })
} */

/** Creates or overwrites a file at the specified path with given file name and writes data to it
 * @param {string} dir - Directory
 * @param {string} file - File name
 * @param {Object} data - Content to write
 * @returns {Promise} Promise
 */
/* database.write = async (dir, file, data) => {
  await fsp.writeFile(
    database.baseDir + dir + '/' + file + '.json',
    JSON.stringify(data)
  )
} */

/** Tries to read a file at the given directory
 * @param {string} dir - Directory
 * @param {string} file - File name
 * @returns {Promise<string>} Promise
 */
/* database.read = async (dir, file) => {
  let data = await fsp.readFile(
    database.baseDir + dir + '/' + file + '.json',
    'utf8'
  )
  return helpers.parseJsonToObject(data)
} */

/** Tries to delete a file in the given directory
 * @param {string} dir - Directory
 * @param {string} file - File name
 * @returns {Promise} Promise
 */
/* database.delete = async (dir, file) => {
  await fsp.unlink(database.baseDir + dir + '/' + file + '.json')
} */
