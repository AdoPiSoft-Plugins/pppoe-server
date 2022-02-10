"use strict";
const util = require("util");
const fs = require("fs");
const read_file = util.promisify(fs.readFile);
const write_text = util.promisify(fs.writeFile);
const writeFile = write_text;
const {machine} = require('@adopisoft/exports')
const db = require('@adopisoft/core/models')
const chap_secrets = process.env.CHAP_PATH || "../etc/ppp/chap-secrets";
const ip_address_pool = process.env.IPADDRESS_POOL || "../etc/ppp/ipaddress_pool";
const IP = require("ip6addr");

var start_ip, end_ip;
async function startIP() {
  if (start_ip) return start_ip;
  var txt = await read_file(ip_address_pool, "utf8").catch(e => "") || "";
  start_ip = (txt.match(/^(\d+.\d+.\d+.\d+)-/) || [])[1];
  return start_ip
}
async function endIP() {
  if (end_ip) return end_ip;
  var txt = await read_file(ip_address_pool, "utf8").catch(e => "") || "";
  var regx = txt.match(/^(\d+.\d+.\d+.\d+)-(\d+)/) || [];
  end_ip = regx[1].replace(/\d+$/, regx[2]);
  return start_ip
}
exports.listAll = async() => {
  const dbi = await db.getInstance()
  let clients = await dbi.models.PppoeAccount.scope(["default_scope"]).findAll({
    raw: true
  });
  return clients || []
};
exports.updateChapSecrets = async() => {
  var clients = await exports.listAll();
  var txt = "";
  clients.forEach(c => {
    let exp_date = c.expiration_date ? new Date(c.expiration_date) : null;
    var is_valid = exp_date instanceof Date && exp_date.getTime() > (new Date).getTime();
    is_valid = is_valid || !c.expiration_date && c.expire_minutes > 0;
    is_valid = is_valid || !c.expire_minutes && !c.expiration_date;
    if (is_valid) {
      txt += `${c.username}	*	${c.password}	${c.ip_address}\n`
    }
  });
  await writeFile(chap_secrets, txt).catch(console.log)
};
exports.isValidPhone = phone => {
  if (!phone) return false;
  return phone.length === 11 || phone.substr(0, 2) === "09" || !isNaN(phone)
};
exports.createClient = async cfg => {
  if (!cfg.username || !cfg.password) {
    throw new Error("Username and password are required fields")
  }
  if (cfg.auto_bill && !exports.isValidPhone(cfg.billing_phone_number)) {
    throw new Error("Phone number is invalid!")
  }
  if (cfg.auto_bill && !(cfg.billing_due_date > 0)) {
    throw new Error("Bill due date is invalid")
  }
  if (cfg.auto_bill && !(cfg.billing_date > 0)) {
    throw new Error("Billing date is invalid")
  }
  var clients = await exports.listAll() || [];
  const dbi = await  db.getInstance()
  var conflict = await dbi.models.PppoeAccount.scope(["default_scope"]).findOne({
    where: {
      username: cfg.username
    }
  });
  if (conflict) throw new Error("Username already exists");
  var i = 0;
  var _ip_ = await startIP();
  while (!cfg.ip_address && i <= 9999) {
    let exists = clients.findIndex(c => c.ip_address === _ip_);
    if (exists >= 0 || _ip_ === await endIP()) {
      _ip_ = IP.parse(_ip_).offset(1).toString();
      i++;
      continue
    }
    cfg.ip_address = _ip_;
    break
  }
  if (cfg.auto_bill) {
    var exp_date = new Date;
    exp_date.setDate(cfg.billing_due_date);
    var ref_date = (new Date()).setDate((new Date).getDate() + 25)
    if (exp_date <= ref_date) {
      exp_date.setMonth(exp_date.getMonth() + 1)
    }
    cfg.expiration_date = exp_date;
    cfg.expire_minutes = 0
  }
  const machine_id = await machine.getId()

  await dbi.models.PppoeAccount.scope(["default_scope"]).create({...cfg,
    machine_id: machine_id
  });
  await exports.updateChapSecrets();
  return exports.listAll()
};
exports.updateClient = async(id, cfg) => {
  if (!cfg.username || !cfg.password) {
    throw new Error("Username and password are required fields")
  }
  if (cfg.auto_bill && !exports.isValidPhone(cfg.billing_phone_number)) {
    throw new Error("Phone number is invalid!")
  }
  if (cfg.auto_bill && !(cfg.billing_due_date > 0)) {
    throw new Error("Bill due date is invalid")
  }
  if (cfg.auto_bill && !(cfg.billing_date > 0)) {
    throw new Error("Billing date is invalid")
  }

  const dbi = await db.getInstance()
  const {Sequelize} = dbi
  const {Op} = Sequelize

  var conflict = await dbi.models.PppoeAccount.scope(["default_scope"]).findOne({
    where: {
      username: cfg.username,
      id: {
        [Op.not]: id
      }
    }
  });
  if (conflict) throw new Error("Username already exists");
  if (cfg.auto_bill && !cfg.expiration_date) {
    var exp_date = cfg.expiration_date ? new Date(cfg.expiration_date) : new Date;
    if (isNaN(exp_date.getTime())) exp_date = new Date;
    exp_date.setDate(cfg.billing_due_date);
    var ref_date = (new Date()).setDate((new Date).getDate() + 25)
    if (exp_date <= ref_date) {
      exp_date.setMonth(exp_date.getMonth() + 1)
    }
    cfg.expiration_date = exp_date;
    cfg.expire_minutes = 0
  }
  await dbi.models.PppoeAccount.update(cfg, {
    where: {
      id: id
    }
  });
  await exports.updateChapSecrets();
  return exports.listAll()
};
exports.deleteClient = async id => {
  const dbi = await db.getInstance()
  await dbi.models.PppoeAccount.scope(["default_scope"]).destroy({
    where: {
      id: id
    }
  });
  await exports.updateChapSecrets();
  return exports.listAll()
};
