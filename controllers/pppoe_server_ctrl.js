'use strict';

var promiseSeries = require("promise.series")
var core = require('../../core')
var config = require("../config.js")
var clients = require("../clients.js")
var path = require('path')
var cmd = require("../lib/cmd.js")
var clients_manager = require("../services/clients-manager.js")
var subscriptions = require("../services/subscriptions.js")
var { bills_manager } = core

exports.checkPaymentStatus = async(s)=>{
  if(!s.auto_bill || !s.expiration_date || !s.expiration_date) return s
  var due_date = new Date(s.expiration_date)
  let ref_number = [s.index, due_date.getTime()].join('')
  s.ref_number = ref_number
  s.is_paid = await bills_manager.isPaid(ref_number)
  s.bill_url = await bills_manager.billUrl(ref_number)
  return s
}

exports.clients = async(req, res, next)=>{
  try{
    var list = await clients.read()
    await promiseSeries(list.map(c=> {
      return async()=>{
        await exports.checkPaymentStatus(c)
      }
    }))

    res.json(list||[])
  }catch(e){
    next(e)
  }
}

exports.settings = async(req, res, next)=>{
  try{
    var cfg = await config.read()
    await config.startServer()
    res.json(cfg)
  }catch(e){
    next(e)
  }
}

exports.updateSettings = async(req, res, next)=>{
  try{
    var prev_cfg = await config.read()
    var params = req.body
    await config.save(params)
    if(prev_cfg.interface != params.interface)
      await config.restartServer()

    res.json({})
  }catch(e){
    next(e)
  }
}

exports.createClient = async(req, res, next)=>{
  try{
    var client = req.body
    await clients.createClient(client)
    res.json(client)
  }catch(e){
    console.log(e)
    next(e)
  }
}

exports.updateClient = async(req, res, next)=>{
  try{
    var {index} = req.params
    var client = req.body
    await clients.updateClient(index, client)
    if(client.status == 'connected'){
      try{
        await clients_manager.connect({ip: client.ip_address, iface: client.iface})
      }catch(e){
        console.log("FAILED TO APPLY CLIENT SETTINGS:", e)
      }
    }
    res.json(client)
  }catch(e){
    next(e)
  }
}

exports.updateBill = async(req, res, next)=>{
  try{
    var {index} = req.params
    var all = await clients.read()
    var client = all[index]
    await subscriptions.generateBill(client)
    res.json({success: true})
  }catch(e){
    next(e)
  }
}

exports.deleteClient = async(req, res, next)=>{
  try{
    var {index} = req.params
    var all = await clients.read()
    var client = all[index]
    try{
      await clients_manager.disconnect({ip: client.ip_address, iface: client.iface, is_expired: true})
    }catch(e){
      console.log("FAILED TO DISCONNECT CLIENT:", e)
    }
    await clients.deleteClient(index)
    res.json({})
  }catch(e){
    next(e)
  }
}

exports.onConnected = async(req, res, next)=>{
  try{
    var {ip, iface} = req.query || {}
    console.log("PPP ONCONNECTED:", {ip, iface})
    await clients_manager.connect({ip, iface})
    res.json({})
  }catch(e){
    console.log(e)
    next(e)
  }
}

exports.onDisconnected = async(req, res, next)=>{
  try{
    var {ip, iface} = req.query || {}
    console.log("PPP DISCONNECTED:", {ip, iface})
    await clients_manager.disconnect({ip, iface})
    res.json({})
  }catch(e){
    console.log(e)
    next(e)
  }
}