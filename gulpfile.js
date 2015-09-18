var gulp        = require('gulp');
var gzip        = require('gulp-gzip');
var gls         = require('gulp-live-server');
var install     = require('gulp-install');
var mocha       = require('gulp-mocha');
var tar         = require('gulp-tar');
var exec        = require('child_process').exec;
var del         = require('del');
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
    'clean',
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
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

// Create tarball
gulp.task('dist:tar', function () {
  gulp.src('dist/**/*')
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
  server.start();
});
