"use strict";
var spawn = require("child_process").spawn,
    colors = require("chalk");

var Child = function(cmd, args) {
  this.cmd = cmd;
  this.args = args;

  process.on("exit", function() {
    if (!this.running) return;
    this.proc.kill("SIGTERM");
  }.bind(this));

  process.on("SIGTERM", function() {
    process.exit();
  });
};

Child.prototype.start = function() {
  if (this.running) return;
  var sig = "["+colors.green("bg")+"]";
  console.log(sig, "Starting", this.cmd, this.args.join(" "));

  this.proc = spawn(this.cmd, this.args, { stdio: 'inherit' });

  this.proc.on("exit", this.exit.bind(this));

  this.running = true;
};

Child.prototype.restart = function() {
  if (!this.running) return this.start();

  this.proc.removeAllListeners("exit").on("exit", function() {
    this.running = false;
    this.start();
  }.bind(this));

  this.proc.kill("SIGTERM");
};

Child.prototype.stop = function() {
  this.proc.kill("SIGTERM");
};

Child.prototype.exit = function(code) {
  this.running = false;
  var msg = "Exited with code "+code;
  var sig = "["+colors[code === 0 ? "gray" : "red"]("bg")+"]";
  console.log(sig, msg);
};

var plugin = module.exports = function(cmd, args) {
  if (!(args instanceof Array)) {
    args = Array.prototype.slice.call(arguments, 1);
  }

  var child = new Child(cmd, args);

  var fn = child.restart.bind(child);
  fn.stop = child.stop.bind(child);

  return Object.defineProperty(fn, 'proc', {
    get: function() {
      return child.proc;
    }
  });
};
