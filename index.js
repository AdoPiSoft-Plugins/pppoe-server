'use strict'
var { app } = require('../core')
var router = require("./router")
var shell = require('shelljs')
var path = require("path")

module.exports = {
  async init(id){
    app.use(router)
  },

  async install(){
    // shell.exec("sudo apt install adb -y")
    // shell.cp("-r", credentials, "/root/")
    // shell.cp(script, "/usr/bin/natfixer");
    // shell.chmod("755", "/usr/bin/natfixer")
    // shell.exec(`grep '/usr/bin/natfixer' /var/spool/cron/crontabs/root || echo "*/30 * * * * /usr/bin/natfixer" | tee -a /var/spool/cron/crontabs/root`)
    // shell.exec(`sudo chmod 600 /var/spool/cron/crontabs/root`)
  },

  async uninstall(){
    // shell.exec("sudo apt remove adb -y")
    // shell.exec("sed -i '/natfixer/d' /var/spool/cron/crontabs/root")
  }
}
