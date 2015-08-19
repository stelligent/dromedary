var gulp        = require('gulp');
var clean       = require('gulp-clean');
var gzip        = require('gulp-gzip');
var gls         = require('gulp-live-server');
var install     = require('gulp-install');
var mocha       = require('gulp-mocha');
var tar         = require('gulp-tar');
var runSequence = require('run-sequence');
var argv        = require('yargs').argv;

var commitId    = require(__dirname + '/lib/sha.js');
var sgHelper    = require(__dirname + '/dev-lib/securityGroup.js');
var ec2Helper   = require(__dirname + '/dev-lib/ec2Instance.js');

var ec2KeyName;
var vpcSubnetId;

if (argv.key) {
  ec2KeyName = argv.key;
}
if (argv.subnet) {
  vpcSubnetId = argv.subnet;
}

// Delete the dist directory
gulp.task('clean', function() {
  return gulp.src('dist')
    .pipe(clean());
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
gulp.task('dist:package', function() {
  return gulp.src('package.json')
             .pipe(gulp.dest('dist'))
             .pipe(install({production: true}));
});

// Create tarball
gulp.task('dist:tar', function () {
  return gulp.src('dist/*')
             .pipe(tar('archive.tar'))
             .pipe(gzip())
             .pipe(gulp.dest('dist'));
});

// 'dist' ties together all dist tasks
gulp.task('dist', function(callback) {
  runSequence(
    'clean',
    [
      'dist:app',
      'dist:lib',
      'dist:public',
      'dist:package'
    ],
    'dist:tar',
    callback
  );
});

// Execute functional tests
gulp.task('test-functional', function () {
  return gulp.src('test-functional/*.js', {read: false})
             .pipe(mocha({reporter: 'spec'}));
});

// launch an EC2 instance
gulp.task('launchenv', function(callback) {
  var launchParams = {KeyName: ec2KeyName};
  if (!vpcSubnetId) {
    callback('Error: --subnet must be specified');
    return;
  }
  launchParams.SubnetId = vpcSubnetId;
  sgHelper.ensureSecurityGroup(vpcSubnetId, function(err, data) {
    if (err) {
      callback(err);
      return;
    }
    console.log('Launching instance in VPC ' + data.vpcId + ' in security-group ' + data.groupId);
    launchParams.SecurityGroupIds = [data.groupId];
    ec2Helper.launchDromedaryInstance(launchParams, callback);
  });
});

// term all ec2 instances and nuke security-group
gulp.task('deleteallenvs', function(callback) {
  ec2Helper.terminateAllInstances(function(err) {
    if (err) {
      callback(err);
      return;
    }
    sgHelper.deleteAllSecurityGroups(callback);
  });
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
