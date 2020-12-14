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

exports.init = async()=>{
  setInterval(async() => {
    await promiseSeries(list.map(({index, client})=>{
      return async()=>{
        var is_valid = (client.expiration_date instanceof(Date)) && client.expiration_date.getTime() > new Date().getTime()
        if(!is_valid){
          await exports.disconnect({ip: client.ip, iface: client.iface})
        }
      }
    }))
  }, TICK_INTERVAL);

  var all = await clients.read()
  await promiseSeries(all.map((c, i)=>{
    return async()=>{
      c.status = DISCONNECTED
      await clients.updateClient(i, c)
    }
  }))
}

exports.connect = async({ip, iface})=>{
  var all = await clients.read()
  var index = all.findIndex(c=> c.ip_address == ip)
  var client = all[index]
  if (!client) return exports.disconnect({ip, iface})
  client.status = CONNECTED
  client.iface = iface
  if(client.expire_minutes > 0){
    client.expiration_date = new Date(new Date().getTime() + client.expire_minutes*60000)
    client.expire_minutes = 0
    client.started_at = new Date()
  }else{
    var is_valid = (client.expiration_date instanceof(Date)) && client.expiration_date.getTime() > new Date().getTime()
    if(!is_valid)
      return exports.disconnect({ip, iface})
  }
  list.push({index, client})
  var {wan_iface} = await config.read()
  console.log("CLIENT:", client)
  await clients.updateClient(index, client)
  await cmd(`${path.join(__dirname, "..", "scripts", "connect.sh")} ${iface} ${wan_iface} ${client.max_download||0} ${client.max_upload||0}`).catch(console.log)
}

exports.disconnect = async({ip, iface})=>{
  var all = await clients.read()
  var index = all.findIndex(c=> c.ip_address == ip)
  var client = all[index]
  if (!client) return
  client.status = DISCONNECTED
  list.splice(list.findIndex(l=> l.index == index), 1)
  var {wan_iface} = await config.read()
  await clients.updateClient(index, client)
  await cmd(`${path.join(__dirname, "..", "scripts", "disconnect.sh")} ${iface} ${wan_iface}`).catch(console.log)
}