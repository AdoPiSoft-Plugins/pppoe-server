'use strict'
var ini = require('ini')
var util = require('util')
var fs = require('fs')
var read_file = util.promisify(fs.readFile)
var write_text = util.promisify(fs.writeFile)
var writeFile = write_text
var chmod = util.promisify(fs.chmod)
var path = require("path")
var ini_file = process.env.PPPOE_CLIENTS_PATH || path.join("/etc", "ppp", "pppoe-clients.ini")
var chap_secrets = process.env.CHAP_PATH || '/etc/ppp/chap-secrets'
var ip_address_pool = process.env.IPADDRESS_POOL || '/etc/ppp/ipaddress_pool'
var IP = require("ip6addr")
var mode = 0o666

var start_ip, end_ip;
async function startIP(){
  if(start_ip) return start_ip
  var txt = await read_file(ip_address_pool, 'utf8').catch(e=> "") || ""
  start_ip = (txt.match(/^(\d+.\d+.\d+.\d+)\-/) || [])[1]
  return start_ip
}

async function endIP(){
  if(end_ip) return end_ip
  var txt = await read_file(ip_address_pool, 'utf8').catch(e=> "") || ""
  var regx = (txt.match(/^(\d+.\d+.\d+.\d+)\-(\d+)/) || [])
  end_ip = regx[1].replace(/\d+$/, regx[2])
  return start_ip
}

function arrayToObj(list){
  return list.reduce((obj, c, i) => {
    if(c.expiration_date instanceof(Date))
      c.expiration_date = c.expiration_date.toISOString();
    if(c.started_at instanceof(Date))
      c.started_at = c.started_at.toISOString();

    if (c.username)
      obj[c.username] = c
    else
      obj[i] = c
    return obj
  }, {})
}

exports.read = async()=>{
  var txt = await read_file(ini_file, 'utf8').catch(e=> "") || ""
  var clients = (await ini.decode(txt) || {clients: {}}).clients || {}
  clients = Object.keys(clients).map((u, index)=> {
    var p = clients[u]
    p.index = index
    if(p.expiration_date){
      p.expiration_date = new Date(p.expiration_date)
    }
    if(p.started_at)
      p.started_at = new Date(p.started_at)
    p.expire_minutes = parseInt(p.expire_minutes)

    return p
  })
  return clients || []
}

exports.updateChapSecrets = async()=>{
  var clients = await exports.read()
  var txt = ""
  clients.forEach(c=>{
    var is_valid = (c.expiration_date instanceof(Date)) ? c.expiration_date.getTime() > new Date().getTime() : c.expire_minutes > 0
    is_valid = is_valid || (!c.expire_minutes && !c.expiration_date) // no expiration
    if(is_valid)
      txt += `${c.username}	*	${c.password}	${c.ip_address}\n`
  })
  await writeFile(chap_secrets, txt).catch(console.log)
}

exports.createClient = async(cfg)=>{
  if(!cfg.username || !cfg.password){
    throw new Error('Username and password are required fields')
  }

  var clients = await exports.read() || []
  var exists = clients.find(c=> c.username == cfg.username)
  if(exists) throw new Error('Username already exists')

  var i = 0
  var _ip_ = await startIP()
  while(!cfg.ip_address && i <= 9999){
    var exists = clients.findIndex(c=> c.ip_address == _ip_)
    if(exists >= 0 || _ip_ == await endIP()){
      _ip_ = IP.parse(_ip_).offset(1).toString()
      i++
      continue
    }
    cfg.ip_address = _ip_
    break
  }

  if(cfg.auto_bill){
    var exp_date = new Date()
    exp_date.setDate(cfg.billing_due_date)
    if(exp_date <= new Date())
      exp_date.setMonth(exp_date.getMonth()+1)
    cfg.expiration_date = exp_date
    cfg.expire_minutes = 0
  }

  clients.push(cfg)
  clients = arrayToObj(clients)

  await writeFile(ini_file, ini.stringify({clients}), {mode})
  await chmod(ini_file, mode)
  await exports.updateChapSecrets()
  return exports.read()
}

exports.updateClient = async(index, cfg)=>{
  if(!cfg.username || !cfg.password){
    throw new Error('Username and password are required fields')
  }
  var clients = await exports.read() || []
  var indx = clients.findIndex(c=> c.username == cfg.username)
  if(indx >= 0 && indx != index) throw new Error('Username already exists')

  clients[index] = cfg
  clients = arrayToObj(clients)

  await writeFile(ini_file, ini.stringify({clients}), {mode})
  await chmod(ini_file, mode)
  await exports.updateChapSecrets()
  return exports.read()
}

exports.deleteClient = async(index)=>{
  var clients = await exports.read() || []
  clients.splice(index, 1);
  clients = arrayToObj(clients)

  await writeFile(ini_file, ini.stringify({clients}), {mode})
  await chmod(ini_file, mode)
  await exports.updateChapSecrets()
  return exports.read()
}
