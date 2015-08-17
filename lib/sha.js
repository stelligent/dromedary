var spawnSync = require('child_process').spawnSync || require('spawn-sync');
var fs = require('fs');
var sha;

function writeVersionFile() {
  var result = spawnSync('git', ['rev-parse', 'HEAD']),
      errorMsg = result.stderr;

  // Write out error if there is one
  if(result.status !== 0) {
    process.stderr.write(errorMsg);
  } else {
    fs.writeFileSync(__dirname + '/sha-raw.js', "module.exports = '" +
        result.stdout.toString().replace(/(\r\n|\n|\r)/gm, '') + "';\n" );
  }
}

sha = function() {
  var shaRaw;
  try {
    writeVersionFile();
  } catch(ignore) {}
  shaRaw = require(__dirname + '/sha-raw.js');

  return shaRaw;
};

module.exports = sha();
