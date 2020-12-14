'use strict';
var clients = require("../clients.js")
var config = require("../config.js")
var path = require("path")
var cmd = require("../lib/cmd.js")
var promiseSeries = require("promise.series")
var CONNECTED = 'connected'
var DISCONNECTED = 'disconnected'
var TICK_INTERVAL = 6e4 //1m
var list = []

exports.init = ()=>{
  setInterval(async() => {
    await promiseSeries(list.map(client=>{
      return async()=>{
        var exp_date = client.expiration_date || new Date()
        var is_expired = exp_date.getTime() <= new Date().getTime()
        if(is_expired){
          await exports.disconnect({ip: client.ip, iface: client.iface})
        }
      }
    }))
  }, TICK_INTERVAL);
}

exports.connect = async({ip, iface})=>{
  var all = await clients.read()
  var index = all.findIndex(c=> c.ip_address == ip)
  if (index < 0) return exports.disconnect({ip, iface})
  var client = all[index]
  client.status = CONNECTED
  client.iface = iface
  if(client.expire_minutes > 0){
    var prev_exp_date = client.expiration_date
    client.expiration_date = new Date(new Date().getTime() + client.expire_minutes*60000);
    client.expire_minutes = 0
    if(!prev_exp_date)
      client.started_at = new Date()
  }else{
    var exp_date = c.expiration_date? new Date(c.expiration_date) : new Date()
    var is_expired = exp_date.getTime() <= new Date().getTime()
    if(is_expired)
      return exports.disconnect({ip, iface})
  }
  list.push({index, client})
  var {wan_iface} = await config.read()
  await cmd(`${path.join(__dirname, "..", "scripts", "connect.sh")} ${iface} ${wan_iface} ${client.max_download||0} ${client.max_upload||0}`)
  await clients.updateClient(index, client)
}

exports.disconnect = async({ip, iface})=>{
  var all = await clients.read()
  var index = all.findIndex(c=> c.ip_address == ip)
  if (index < 0) return
  var client = list[index]
  client.status = DISCONNECTED
  list.splice(list.findIndex(l=> l.index == index), 1)
  var {wan_iface} = await config.read()
  await cmd(`${path.join(__dirname, "..", "scripts", "disconnect.sh")} ${iface} ${wan_iface}`)
  await clients.updateClient(index, client)
}