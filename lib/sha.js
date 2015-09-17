var spawnSync = require('child_process').spawnSync || require('spawn-sync');
var moment = require('moment');
var fs = require('fs');
var sha;

function writeVersionFile() {
  var gitRevParseResult = spawnSync('git', ['rev-parse', 'HEAD']);
  var buildVersion = moment().format('YYYYMMDD-HHmmss');

  // Write out error if there is one
  if (gitRevParseResult.status === 0) {
    buildVersion = gitRevParseResult.stdout.toString().replace(/(\r\n|\n|\r)/gm, '');
  } else {
    console.log('Unable to determine commit sha via git');
    console.log('Falling back to build time in place of commit sha');
  }
  fs.writeFileSync(__dirname + '/../dev-lib/sha.js', "module.exports = '" + buildVersion + "';\n");
}

sha = function() {
  var shaRaw;
  writeVersionFile();
  shaRaw = require(__dirname + '/../dev-lib/sha.js');

  return shaRaw;
};

module.exports = sha();
