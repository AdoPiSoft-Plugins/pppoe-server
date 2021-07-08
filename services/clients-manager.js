'use strict';
var clients = require("../clients.js")
var config = require("../config.js")
var path = require("path")
var cmd = require("../lib/cmd.js")
var promiseSeries = require("promise.series")
var CONNECTED = 'connected'
var DISCONNECTED = 'disconnected'
var TICK_INTERVAL = 6e4 //1m

exports.init = async()=>{
  setInterval(async() => {
    var ppp_ifaces = ""
    try{
      await cmd(`${path.join(__dirname, "..", "scripts", "list-ppp.sh")}`, { onData: (o)=>{ppp_ifaces += o} })
    }catch(e){}
    var list = await clients.read()
    await promiseSeries(list.map(client=>{
      return async()=>{
        var is_valid = (client.expiration_date instanceof(Date)) && client.expiration_date.getTime() > new Date().getTime()
        is_valid = is_valid || (!client.expiration_date && !client.expire_minutes)
        if(!is_valid){
          await exports.disconnect({ip: client.ip_address, iface: client.iface, is_expired: true})
        }else if(ppp_ifaces.includes(client.ip_address) && client.status != CONNECTED){
          await exports.connect({ip: client.ip_address, iface: client.iface})
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
  }else{
    var is_valid = (client.expiration_date instanceof(Date)) && client.expiration_date.getTime() > new Date().getTime()
    is_valid = is_valid || (!client.expiration_date && !client.expire_minutes) // no exp
    if(!is_valid)
      return exports.disconnect({ip, iface, is_expired: true})
  }
  if(!client.started_at)
    client.started_at = new Date()

  var {wan_iface} = await config.read()
  await clients.updateClient(index, client)
  await cmd(`${path.join(__dirname, "..", "scripts", "connect.sh")} ${iface} ${wan_iface} ${client.max_download||0} ${client.max_upload||0}`).catch(console.log)
}

exports.disconnect = async({ip, iface, is_expired})=>{
  var all = await clients.read()
  var index = all.findIndex(c=> c.ip_address == ip)
  var client = all[index]
  if (!client) return

  if(!is_expired){
    await new Promise(r=> setTimeout(r, 3e4)) //wait for 30s
    var is_up = await new Promise(async(r)=>{
      try{
        var res = "";
        await cmd("ls /sys/class/net", { onData: (o)=>{res += o} })
        r(res.includes(iface))
      }catch(e){
        r()
      }
    })
    if(is_up) return
  }
  
  client.status = DISCONNECTED
  var {wan_iface} = await config.read()
  if (client.iface){
    await cmd(`${path.join(__dirname, "..", "scripts", "disconnect.sh")} ${iface} ${wan_iface}`).catch(console.log)
  }
  client.iface = null
  await clients.updateClient(index, client)
}