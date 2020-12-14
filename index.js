'use strict'
var { app } = require('../core')
var router = require("./router")
var shell = require('shelljs')
var path = require("path")
var config = require("./config")
var clients_manager = require("./services/clients-manager.js")
var cmd = require("./lib/cmd.js")

module.exports = {
  async init(id){
    app.use(router)
    var cfg = await config.read()
    var iface = cfg.interface
    await clients_manager.init()
    if(iface)
      await cmd(`${path.join(__dirname, "scripts/start.sh")} ${iface}`)

  },

  async install(){
    shell.exec(`sudo chmod a+x ${path.join(__dirname, "scripts/install.sh")}`)
    shell.exec(`sudo chmod a+x ${path.join(__dirname, "scripts/uninstall.sh")}`)
    shell.exec(`sudo chmod a+x ${path.join(__dirname, "scripts/start.sh")}`)
    await cmd(path.join(__dirname, "scripts/install.sh"))
  },

  async uninstall(){
    await cmd(path.join(__dirname, "scripts/uninstall.sh"))
  }
}
