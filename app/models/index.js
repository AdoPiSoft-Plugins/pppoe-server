"use strict";
const {machine} = require('@adopisoft/exports')
const core_models = require('@adopisoft/core/models')
const PppoeAccount = require("./pppoe_account.js");
const model_files = {
  PppoeAccount: PppoeAccount
};

exports.init = async() => {
  const {Sequelize, sequelize, models} = await core_models.getInstance()
  const db = await sequelize.getInstance()
  const machine_id = await machine.getId()
  if (!models) return;
  var keys = Object.keys(model_files);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    models[k] = model_files[k](db, Sequelize);
    try {
      await models[k].sync({
        alter: true
      })
    } catch (e) {}
  }
  var default_scope = {
    where: {
      machine_id: machine_id
    }
  };
  models.PppoeAccount.addScope("default_scope", default_scope);
  return {Sequelize, sequelize, models}
};