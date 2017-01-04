'use strict';
var through2 = require('through2'),
  gutil = require('gulp-util'),
  path = require('path'),
  commandRunner = require('./lib/commandRunner'),
  cmdMap = {
    'tsd.json': {
      cmd: 'tsd',
      args: ['reinstall', '--save']
    },
    'bower.json': {
      cmd: 'bower',
      args: ['install', '--config.interactive=false']
    },
    'package.json': {
      cmd: 'npm',
      args: ['install']
    },
    'requirements.txt': {
      cmd: 'pip',
      args: ['install', '-r', 'requirements.txt']
    }
  };

module.exports = exports = function install(opts) {
  var toRun = [],
    count = 0;

  return through2({
      objectMode: true
    },
    function(file, enc, cb) {
      if (!file.path) {
        cb();
      }
      var cmd = clone(cmdMap[path.basename(file.path)]);

      if (cmd) {
        if (opts && opts.production) {
          cmd.args.push('--production');
        }
        if (opts && opts.ignoreScripts) {
          cmd.args.push('--ignore-scripts');
        }
        if (cmd.cmd === 'bower' && opts && opts.allowRoot) {
          cmd.args.push('--allow-root');
        }
        if (cmd.cmd === 'npm' && opts && opts.noOptional) {
          cmd.args.push('--no-optional');
        }

        cmd.cwd = path.dirname(file.path);
        toRun.push(cmd);
      }
      this.push(file);
      cb();
    },
    function(cb) {
      if (!toRun.length) {
        return cb();
      }
      if (skipInstall()) {
        log('Skipping install.', 'Run `' + gutil.colors.yellow(formatCommands(toRun)) + '` manually');
        return cb();
      } else {
        toRun.forEach(function(command) {
          commandRunner.run(command, function(err) {
            if (err) {
              log(err.message, ', run `' + gutil.colors.yellow(formatCommand(command)) + '` manually');
              return cb(err);
            }
            done(cb, toRun.length);
          });
        });
      }
    }
  );

  function done(cb, length) {
    if (++count === length) {
      cb();
    }
  }
};

function log() {
  if (isTest()) {
    return;
  }
  gutil.log.apply(gutil, [].slice.call(arguments));
}

function formatCommands(cmds) {
  return cmds.map(formatCommand).join(' && ');
}

function formatCommand(command) {
  return command.cmd + ' ' + command.args.join(' ');
}

function skipInstall() {
  return process.argv.slice(2).indexOf('--skip-install') >= 0;
}

function isTest() {
  return process.env.NODE_ENV === 'test';
}

function clone(obj) {
  if (Array.isArray(obj)) {
    return obj.map(clone);
  } else if (typeof obj === 'object') {
    var copy = {};
    Object.keys(obj).forEach(function(key) {
      copy[key] = clone(obj[key]);
    });
    return copy;
  } else {
    return obj;
  }
}
