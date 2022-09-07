"use strict";
const fs = require("fs-extra");
const promiseSeries = require("promise.series");
const {app} = require('@adopisoft/exports')
const router = require("./router");
const clients = require("./clients");
const models = require("./models");
const path = require("path");
const config = require("./config");
const clients_manager = require("./services/clients-manager.js");
const subscriptions = require("./services/subscriptions.js");
const cmd = require("./lib/cmd.js");
const config_ini_path = "../etc/ppp/pppoe-config.ini";

module.exports = {
  async init(id) {
    await models.init();
    await clients_manager.init();
    await subscriptions.init();
    app.use(router);
    setTimeout(async() => {
      await config.startServer()
    }, 18e4);
    var script_files = await fs.readdir(path.join(__dirname, '..', "scripts"));
    await Promise.all(script_files.map(async f => {
      var script_path = path.join(__dirname, '..', "scripts", f);
      await cmd(`/bin/chmod a+x ${script_path}`)
    }))
  },
  async install() {
    try {
      await cmd(`/bin/chmod a+x ${path.join(__dirname, '..',"scripts/install.sh")}`).catch(console.log);
      await cmd(path.join(__dirname, '..', "scripts/install.sh")).catch(console.log)
    } catch (e) {
      console.log(e)
    }
  },
  async uninstall() {
    try {
      await cmd(path.join(__dirname, '..', "scripts/uninstall.sh"))
    } catch (e) {
      console.log(e)
    }
  },
  async backup(backup_dir, plugin_name) {
    console.log("Backing up: ", plugin_name);
    try {
      await fs.promises.mkdir(path.join(backup_dir, "plugins", plugin_name), {
        recursive: true
      }).catch(console.error);
      var config_dest_ini = path.join(backup_dir, "plugins", plugin_name, "pppoe-config.ini");
      if (await fs.pathExists(config_ini_path)) {
        await fs.copy(config_ini_path, config_dest_ini)
      }
      var clients_dest_json = path.join(backup_dir, "plugins", plugin_name, "pppoe-clients.json");
      var list = await clients.listAll();
      if (list.length) {
        await fs.promises.writeFile(clients_dest_json, JSON.stringify(list))
      }
    } catch (e) {
      console.log(e)
    }
  },
  async restore(extract_dir, plugin_name) {
    try {
      var backup_clients_json_path = path.join(extract_dir, "plugins", plugin_name, "pppoe-clients.json");
      if (await fs.pathExists(backup_clients_json_path)) {
        var backup_clients = JSON.parse(await fs.promises.readFile(backup_clients_json_path, "utf8"));
        await promiseSeries(backup_clients.map(c => {
          return async() => {
            try {
              await clients.createClient(c)
            } catch (e) {}
          }
        }))
      }
      var backup_config_ini_path = path.join(extract_dir, "plugins", plugin_name, "pppoe-config.ini");
      if (await fs.pathExists(backup_config_ini_path)) {
        await fs.copy(backup_config_ini_path, config_ini_path)
      }
    } catch (e) {}
  }
};