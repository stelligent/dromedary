var gulp        = require('gulp');
var gzip        = require('gulp-gzip');
var gls         = require('gulp-live-server');
var install     = require('gulp-install');
var mocha       = require('gulp-mocha');
var tar         = require('gulp-tar');
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

// Copy files to dist/ directory
gulp.task('dist:app', function() {
  return gulp.src('app.js')
             .pipe(gulp.dest('dist'));
});
gulp.task('dist:lib', function() {
  return gulp.src('lib/*.js')
             .pipe(gulp.dest('dist/lib'));
});
 
gulp.task('dist:public', function() {
  return gulp.src('public/*')
             .pipe(gulp.dest('dist/public'));

});
gulp.task('dist:cookbooks', function() {
  return gulp.src('cookbooks/**/*')
             .pipe(gulp.dest('dist/cookbooks'));

});
gulp.task('dist:package', function() {
  return gulp.src(['package.json', 'appspec.yml'])
             .pipe(gulp.dest('dist'))
             .pipe(install({production: true}));
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
    [
      'dist:app',
      'dist:lib',
      'dist:public',
      'dist:cookbooks',
      'dist:package'
    ],
    'dist:tar',
    callback
  );
});


// 'copy' is used to copy everything into the cookbooks dir
gulp.task('copy-to-cookbooks', function () {
  gulp.src(['app.js', 'package.json', 'appspec.yml'] )
    .pipe(gulp.dest('cookbooks/dromedary/files/default'))
  gulp.src([ 'lib/*.js' ] )
    .pipe(gulp.dest('cookbooks/dromedary/files/default/lib'))
  gulp.src(['public/*'] )
    .pipe(gulp.dest('cookbooks/dromedary/files/default/public'))
})

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
