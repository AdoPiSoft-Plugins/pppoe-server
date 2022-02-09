"use strict";
var spawn = require("child_process").spawn;
module.exports = (command_str, opts) => {
  opts = opts || {};
  var delay = opts.delay || 0;
  var shell = !!opts.shell;
  command_str = command_str.trim().replace(/  +/g, " ");
  var args = command_str.split(" ");
  var cmd = args.splice(0, 1);
  var error = null;
  var done = false;
  return new Promise((resolve, reject) => {
    var exec = spawn(cmd[0], args, {
      shell: shell
    });
    exec.stderr.on("data", err => {
      if (err) error = error ? error + "\n" + err.toString() : err.toString()
    });
    if (typeof opts.onData == "function") {
      exec.stdout.on("data", msg => {
        msg = msg.toString();
        opts.onData(msg)
      })
    }
    exec.on("error", err => {
      if (!done) {
        error = err.toString();
        done = true;
        reject(error)
      }
    });
    exec.on("close", code => {
      if (!done) {
        done = true;
        if (!error && code == 0) {
          if (delay > 0) setTimeout(() => resolve(code), delay);
          else resolve(code)
        } else reject(error)
      }
    })
  })
};