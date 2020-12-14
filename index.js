'use strict'
var { app } = require('../core')
var router = require("./router")
var shell = require('shelljs')
var path = require("path")
var config = require("./config")
var clients_manager = require("./services/clients-manager.js")

module.exports = {
  async init(id){
    app.use(router)
    var cfg = await config.read()
    var iface = cfg.interface
    if(iface)
      shell.exec(`${path.join(__dirname, "scripts/start.sh")} ${iface}`)

    await clients_manager.init()
  },

  async install(){
    shell.exec(`sudo chmod a+x ${path.join(__dirname, "scripts/install.sh")}`)
    shell.exec(`sudo chmod a+x ${path.join(__dirname, "scripts/uninstall.sh")}`)
    shell.exec(`sudo chmod a+x ${path.join(__dirname, "scripts/start.sh")}`)
    shell.exec(path.join(__dirname, "scripts/install.sh"))
  },

  async uninstall(){
    shell.exec(path.join(__dirname, "scripts/uninstall.sh"))
  }
}
