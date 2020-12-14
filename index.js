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
    setTimeout(async()=>{
      await config.startServer()
    }, 3e5) //5m

  },

  async install(){
    try{
      await cmd(`chmod a+x ${path.join(__dirname, "scripts/install.sh")}`).catch(console.log)
      await cmd(`chmod a+x ${path.join(__dirname, "scripts/uninstall.sh")}`).catch(console.log)
      await cmd(`chmod a+x ${path.join(__dirname, "scripts/start.sh")}`).catch(console.log)
      await cmd(`chmod a+x ${path.join(__dirname, "scripts/connect.sh")}`).catch(console.log)
      await cmd(`chmod a+x ${path.join(__dirname, "scripts/disconnect.sh")}`).catch(console.log)
      await cmd(path.join(__dirname, "scripts/install.sh")).catch(console.log)
    }catch(e){
      console.log(e)
    }
  },

  async uninstall(){
    try{
      await cmd(path.join(__dirname, "scripts/uninstall.sh"))
    }catch(e){
      console.log(e)
    }
  }
}
