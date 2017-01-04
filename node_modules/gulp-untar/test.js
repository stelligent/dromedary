var gutil = require('gulp-util')
var assert = require('assert')
var fs = require('fs')
var _ = require('lodash')
var through = require('through2')
var untar = require('./index')

describe('gulp-untar', function () {
  function assertOutput(done) {
    var files = []

    return through.obj(function (file, enc, callback) {
      files.push(file)
      callback()
    }, function () {
      assert.equal(files.length, 2)

      var file1 = _.find(files, {path: 'fixtures/file1.txt', base: './fixtures', cwd: '.'})
      assert.ok(file1, 'No file found named "fixtures/file1.txt"')
      assert.ok(file1.isBuffer(), 'Expected buffer')
      assert.equal('File 1\n', file1.contents.toString())

      var file2 = _.find(files, {path: 'fixtures/dir1/file2.txt', base: './fixtures', cwd: '.'})
      assert.ok(file2, 'No file found named "fixtures/dir1/file2.txt"')
      assert.ok(file2.isBuffer(), 'Expected buffer')
      assert.equal('File 2\n', file2.contents.toString())

      done()
    })
  }

  context('in streaming mode', function () {
    it('should untar files', function (done) {
      var stream = untar()

      stream.pipe(assertOutput(done))

      stream.write(new gutil.File({
        path: './fixtures/test.tar',
        base: './fixtures',
        cwd: '.',
        contents: fs.createReadStream('./fixtures/test.tar')
      }))

      stream.end()
    })

  })

  context('in buffer mode', function () {
    it('should untar files', function (done) {
      var stream = untar()

      stream.pipe(assertOutput(done))

      stream.write(new gutil.File({
        path: './fixtures/test.tar',
        base: './fixtures',
        cwd: '.',
        contents: fs.readFileSync('./fixtures/test.tar')
      }))

      stream.end()
    })
  })

  context('null files', function () {
    it('should let them pass through', function (done) {
      var stream = untar()

      stream.on('data', function (file) {
        assert.equal(file.path, './fixtures/test.tar')
        done()
      })

      stream.write(new gutil.File({
        path: './fixtures/test.tar',
        base: './fixtures',
        cwd: '.',
        contents: null
      }))
    })
  })
})
