'use strict'

var { dbi, machine_id } = require('plugin-core')
var PppoeAccount = require('./pppoe_account.js')

var model_files = {
  PppoeAccount
}

exports.init = async () => {
  if (!dbi) return
  var { sequelize, Sequelize } = dbi
  var db = await sequelize.getInstance()

  var keys = Object.keys(model_files)
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i]
    dbi.models[k] = model_files[k](db, Sequelize)
    try {
      await dbi.models[k].sync({alter: true})
    } catch (e) {}
  }

  var default_scope = {
    where: { machine_id }
  }

  dbi.models.PppoeAccount.addScope('default_scope', default_scope)

  return dbi
}
