const clients = require("../clients.js");
const config = require("../config.js");
const path = require("path");
const cmd = require("../lib/cmd.js");
const promiseSeries = require("promise.series");
const db = require('@adopisoft/core/models')
const CONNECTED = "connected";
const DISCONNECTED = "disconnected";
const TICK_INTERVAL = 6e4;

exports.init = async() => {
  setInterval(async() => {
    var ppp_ifaces = "";
    try {
      await cmd(`${path.join(__dirname,"/../../","scripts","list-ppp.sh")}`, {
        onData: o => {
          ppp_ifaces += o
        }
      })
    } catch (e) {}
    var list = await clients.listAll();
    await promiseSeries(list.map(client => {
      return async() => {
        let exp_date = client.expiration_date ? new Date(client.expiration_date) : null;
        var is_valid = exp_date instanceof Date && exp_date.getTime() > (new Date).getTime();
        is_valid = is_valid || !client.expiration_date && client.expire_minutes > 0;
        is_valid = is_valid || !client.expiration_date && !client.expire_minutes;
        if (!is_valid) {
          await exports.disconnect({
            ip: client.ip_address,
            iface: client.iface,
            is_expired: true
          })
        } else if (ppp_ifaces.includes(client.ip_address) && client.status != CONNECTED) {
          await exports.connect({
            ip: client.ip_address,
            iface: client.iface
          })
        }
      }
    }))
  }, TICK_INTERVAL);
  var all = await clients.listAll();
  await promiseSeries(all.map((c, i) => {
    return async() => {
      c.status = DISCONNECTED;
      await clients.updateClient(c.id, c)
    }
  }))
};
exports.connect = async({
  ip,
  iface
}) => {
  const dbi = await db.getInstance()
  var client = await dbi.models.PppoeAccount.scope(["default_scope"]).findOne({
    where: {
      ip_address: ip
    },
    raw: true
  });
  if (!client) return exports.disconnect({
    ip: ip,
    iface: iface
  });
  client.status = CONNECTED;
  client.iface = iface;
  if (client.expire_minutes > 0) {
    client.expiration_date = new Date((new Date).getTime() + client.expire_minutes * 6e4);
    client.expire_minutes = 0
  } else {
    let exp_date = client.expiration_date ? new Date(client.expiration_date) : null;
    var is_valid = exp_date instanceof Date && exp_date.getTime() > (new Date).getTime();
    is_valid = is_valid || !client.expiration_date && !client.expire_minutes;
    if (!is_valid) {
      return exports.disconnect({
        ip: ip,
        iface: iface,
        is_expired: true
      })
    }
  }
  if (!client.started_at) {
    client.started_at = new Date
  }
  var {
    wan_iface
  } = await config.read();
  await clients.updateClient(client.id, client);
  await cmd(`${path.join(__dirname,"/../../","scripts","connect.sh")} ${iface} ${wan_iface} ${client.max_download||0} ${client.max_upload||0}`).catch(console.log)
};
exports.disconnect = async({
  ip,
  iface,
  is_expired
}) => {
  const dbi = await db.getInstance()
  var client = await dbi.models.PppoeAccount.findOne({
    where: {
      ip_address: ip
    },
    raw: true
  });
  if (!client) return;
  if (!is_expired) {
    await new Promise(resolve => setTimeout(resolve, 3e4));
    var is_up = await new Promise(resolve => {
      try {
        var res = "";
        cmd("ls /sys/class/net", {
          onData: o => {
            res += o
          }
        }).then(() => {
          resolve(res.includes(iface))
        })
      } catch (e) {
        resolve()
      }
    });
    if (is_up) return
  }
  client.status = DISCONNECTED;
  var {
    wan_iface
  } = await config.read();
  if (client.iface) {
    await cmd(`${path.join(__dirname,"/../../","scripts","disconnect.sh")} ${iface} ${wan_iface}`).catch(console.log)
  }
  client.iface = null;
  await clients.updateClient(client.id, client)
};