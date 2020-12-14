'use strict';

var core = require('../../core')
var config = require("../config.js")
var clients = require("../clients.js")
var path = require('path')
var cmd = require("../lib/cmd.js")
var clients_manager = require("../services/clients-manager.js")

exports.clients = async(req, res, next)=>{
  try{
    var list = await clients.read()
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

exports.deleteClient = async(req, res, next)=>{
  try{
    var {index} = req.params
    var all = await clients.read()
    await clients.deleteClient(index)

    var client = all[index]
    if(client.status == 'connected'){
      try{
        await clients_manager.disconnect({ip: client.ip_address, iface: client.iface})
      }catch(e){
        console.log("FAILED TO DISCONNECT CLIENT:", e)
      }
    }

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