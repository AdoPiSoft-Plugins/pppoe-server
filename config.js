'use strict'
var ini = require('ini')
var util = require('util')
var fs = require('fs')
var read_file = util.promisify(fs.readFile)
var write_text = util.promisify(fs.writeFile)
var chmod = util.promisify(fs.chmod)
var path = require("path")
var ini_file = process.env.PPPOE_CONFIG_PATH || path.join("/var", "cache", "pppoe-config.ini")
var mode = 0o666

exports.server_started = false
exports.startServer = async()=>{
  if(exports.server_started) return
  try{
    var cfg = exports.read()
    if(!cfg.interface) throw new Error("Interface not yet setup")
    await cmd(`${path.join(__dirname, "scripts/start.sh")} ${cfg.interface}`)
    exports.server_started = true
  }catch(e){
    console.log("ERROR Starting PPPOE Server", e)
  }
}

exports.restartServer = ()=>{
  exports.server_started = false
  return exports.startServer()
}

exports.read = async()=>{
  return read_file(ini_file, 'utf8').then(txt => {
    return ini.decode(txt||"") || {}
  }).catch(e=>{
    return {}
  })
}

exports.save = async(cfg)=>{
  return write_text(ini_file, ini.stringify(cfg), {mode})
    .then(() => chmod(ini_file, mode))
    .then(() => cfg)
}