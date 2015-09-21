var gulp        = require('gulp');
var download    = require('gulp-download');
var gzip        = require('gulp-gzip');
var gunzip      = require('gulp-gunzip');
var gls         = require('gulp-live-server');
var install     = require('gulp-install');
var mocha       = require('gulp-mocha');
var tar         = require('gulp-tar');
var untar       = require('gulp-untar');
var gutil       = require('gulp-util');
var exec        = require('child_process').exec;
var del         = require('del');
var fs          = require('fs');
var runSequence = require('run-sequence');
var argv        = require('yargs').argv;

var commitId    = require(__dirname + '/lib/sha.js');

// Delete the dist directory
gulp.task('clean', function (cb) {
  del(['cookbooks/dromedary/files/*', 'dist'], cb);
});

// Execute unit tests
gulp.task('test', function () {
  return gulp.src('test/*.js', {read: false})
             .pipe(mocha({reporter: 'spec'}));
});

// Copy dromedary app to cookbooks/dromedary/files/default/app
gulp.task('cookbookfiles:app', function () {
  return gulp.src(['app.js', 'appspec.yml'] )
             .pipe(gulp.dest('cookbooks/dromedary/files/default/app'));
});
gulp.task('cookbookfiles:lib', function () {
  return gulp.src(['lib/*.js', 'dev-lib/sha.js'] )
             .pipe(gulp.dest('cookbooks/dromedary/files/default/app/lib'));
});
gulp.task('cookbookfiles:public', function () {
  return gulp.src(['public/*'] )
             .pipe(gulp.dest('cookbooks/dromedary/files/default/app/public'));
});
gulp.task('cookbookfiles:package', function () {
  return gulp.src(['package.json'])
             .pipe(gulp.dest('cookbooks/dromedary/files/default/app'))
             .pipe(install({production: true}));
});

// Alias to run above tasks
gulp.task('copy-to-cookbooks', function(callback) {
  runSequence(
    [ 'cookbookfiles:app',
      'cookbookfiles:lib',
      'cookbookfiles:public',
      'cookbookfiles:package' ],
    callback
  );
});

// Copy cookbooks to dist/
gulp.task('dist:berks-vendor', function (cb) {
  exec('cd cookbooks/dromedary/ && berks vendor ../../dist', function (err, stdout, stderr) {
    gutil.log(stdout);
    gutil.log(stderr);
    cb(err);
  });
});

// Create tarball
gulp.task('dist:tar', function () {
  return gulp.src('dist/**/*')
             .pipe(tar('archive.tar'))
             .pipe(gzip())
             .pipe(gulp.dest('dist'));
});

// 'dist' ties together all dist tasks
gulp.task('dist', function(callback) {
  runSequence(
    'clean',
    'copy-to-cookbooks',
    'dist:berks-vendor',
    'dist:tar',
    callback
  );
});

// Execute functional tests
gulp.task('test-functional', function () {
  if (process.env.hasOwnProperty('AUTOMATED_ACCEPTANCE_TEST')) {
    process.env.TARGET_URL = 'http://localhost:' + require(__dirname + '/dev-lib/targetPort.js');
  }
  return gulp.src('test-functional/*.js', {read: false})
             .pipe(mocha({reporter: 'spec'}));
});

// Default is (for now) just test & dist
gulp.task('default', function(callback) {
  runSequence(
    'test',
    'dist',
    callback
  );
});

gulp.task('serve', function() {
  var server = gls.new('app.js');
  return server.start();
});

// Support for DDB local - tasks to clean ddb dir, download and untar
gulp.task('ddb-local:clean', function (cb) {
  del(['ddb-local'], cb);
});

gulp.task('ddb-local:download', function() {
  return download('http://dynamodb-local.s3-website-us-west-2.amazonaws.com/dynamodb_local_latest.tar.gz')
                  .pipe(gulp.dest(__dirname + '/ddb-local/'));
});
gulp.task('ddb-local:untar', function () {
  return gulp.src(__dirname + '/ddb-local/dynamodb_local_latest.tar.gz')
             .pipe(gunzip())
             .pipe(untar())
             .pipe(gulp.dest('.'));
});

// Hacky way to run the ddb-local:download & ddb-local:untar only when we need to
gulp.task('ddb-local:download-wrapper', function(callback) {
  fs.stat(__dirname + '/ddb-local/DynamoDBLocal.jar', function(err) {
    if (err) {
      runSequence(
        'ddb-local:download',
        'ddb-local:untar',
        callback
      );
    } else {
      gutil.log(__dirname + '/ddb-local/DynamoDBLocal.jar exists. Skipping download.');
      callback();
    }
  });
});

gulp.task('ddb-local', function(callback) {
  runSequence(
    'ddb-local:download-wrapper',
    callback
  );
});
