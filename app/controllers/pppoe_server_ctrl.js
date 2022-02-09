"use strict";
const promiseSeries = require("promise.series");
const config = require("../config.js");
const clients = require("../clients.js");
const clients_manager = require("../services/clients-manager.js");
const subscriptions = require("../services/subscriptions.js");
const bills_manager = require('@adopisoft/core/bills_manager')
const db = require('@adopisoft/core/models')

exports.checkPaymentStatus = async s => {
  if (!s.auto_bill || !s.expiration_date || !s.expiration_date) return s;
  let due_date = new Date(s.expiration_date);
  let ref_number = [s.id, due_date.getTime()].join("");
  s.ref_number = ref_number;
  s.is_paid = await bills_manager.isPaid(ref_number);
  s.bill_url = await bills_manager.billUrl(ref_number);
  return s
};
exports.clients = async(req, res, next) => {
  try {
    let list = await clients.listAll();
    await promiseSeries(list.map(c => {
      return async() => {
        await exports.checkPaymentStatus(c)
      }
    }));
    res.json(list || [])
  } catch (e) {
    next(e)
  }
};
exports.settings = async(req, res, next) => {
  try {
    let cfg = await config.read();
    await config.startServer();
    res.json(cfg)
  } catch (e) {
    next(e)
  }
};
exports.updateSettings = async(req, res, next) => {
  try {
    let prev_cfg = await config.read();
    let params = req.body;
    await config.save(params);
    if (prev_cfg.interface != params.interface) {
      await config.restartServer()
    }
    res.json({})
  } catch (e) {
    next(e)
  }
};
exports.createClient = async(req, res, next) => {
  try {
    let client = req.body;
    await clients.createClient(client);
    res.json(client)
  } catch (e) {
    console.log(e);
    next(e)
  }
};
exports.updateClient = async(req, res, next) => {
  try {
    let {
      id
    } = req.params;
    let client = req.body;
    await clients.updateClient(id, client);
    if (client.status == "connected") {
      try {
        await clients_manager.connect({
          ip: client.ip_address,
          iface: client.iface
        })
      } catch (e) {
        console.log("FAILED TO APPLY CLIENT SETTINGS:", e)
      }
    }
    res.json(client)
  } catch (e) {
    next(e)
  }
};
exports.updateBill = async(req, res, next) => {
  try {
    let {
      id
    } = req.params;
    const dbi = await db.getInstance()
    let client = await dbi.models.PppoeAccount.findByPk(id);
    await subscriptions.generateBill(client.get({
      plain: true
    }));
    res.json({
      success: true
    })
  } catch (e) {
    next(e)
  }
};
exports.deleteClient = async(req, res, next) => {
  try {
    let {
      id
    } = req.params;
    const dbi = await db.getInstance()
    let client = await dbi.models.PppoeAccount.findByPk(id);
    try {
      await clients_manager.disconnect({
        ip: client.ip_address,
        iface: client.iface,
        is_expired: true
      })
    } catch (e) {
      console.log("FAILED TO DISCONNECT CLIENT:", e)
    }
    await clients.deleteClient(id);
    res.json({})
  } catch (e) {
    next(e)
  }
};
exports.onConnected = async(req, res, next) => {
  try {
    let {
      ip,
      iface
    } = req.query || {};
    console.log("PPP ONCONNECTED:", {
      ip: ip,
      iface: iface
    });
    await clients_manager.connect({
      ip: ip,
      iface: iface
    });
    res.json({})
  } catch (e) {
    console.log(e);
    next(e)
  }
};
exports.onDisconnected = async(req, res, next) => {
  try {
    let {
      ip,
      iface
    } = req.query || {};
    console.log("PPP DISCONNECTED:", {
      ip: ip,
      iface: iface
    });
    await clients_manager.disconnect({
      ip: ip,
      iface: iface
    });
    res.json({})
  } catch (e) {
    console.log(e);
    next(e)
  }
};