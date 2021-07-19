'use strict'

var fs = require('fs-extra')
var promiseSeries = require('promise.series')

var { app } = require('plugin-core')
var router = require('./router')
var clients = require('./clients')
var path = require('path')
var config = require('./config')
var clients_manager = require('./services/clients-manager.js')
var subscriptions = require('./services/subscriptions.js')
var cmd = require('./lib/cmd.js')
var clients_ini_path = '/etc/ppp/pppoe-clients.ini'
var config_ini_path = '/etc/ppp/pppoe-config.ini'

module.exports = {
  async init (id) {
    app.use(router)
    await clients_manager.init()
    await subscriptions.init()
    setTimeout(async () => {
      await config.startServer()
    }, 18e4) //3m
    var script_files = await fs.readdir(path.join(__dirname, 'scripts'))
    await Promise.all(script_files.map(async f => {
      var script_path = path.join(__dirname, 'scripts', f)
      await cmd(`/bin/chmod a+x ${script_path}`)
    }))
  },

  async install () {
    try {
      await cmd(`/bin/chmod a+x ${path.join(__dirname, 'scripts/install.sh')}`).catch(console.log)
      await cmd(path.join(__dirname, 'scripts/install.sh')).catch(console.log)
    } catch (e) {
      console.log(e)
    }
  },

  async uninstall () {
    try {
      await cmd(path.join(__dirname, 'scripts/uninstall.sh'))
    } catch (e) {
      console.log(e)
    }
  },

  async backup (backup_dir, plugin_name) {
    console.log('Backing up: ', plugin_name)
    try {
      var clients_dest_ini = path.join(backup_dir, 'plugins', plugin_name, 'pppoe-clients.ini')
      if (await fs.pathExists(clients_ini_path)) {
        await fs.copy(clients_ini_path, clients_dest_ini)
      }

      var config_dest_ini = path.join(backup_dir, 'plugins', plugin_name, 'pppoe-config.ini')
      if (await fs.pathExists(config_ini_path)) {
        await fs.copy(config_ini_path, config_dest_ini)
      }
    } catch (e) {
      console.log(e)
    }
  },

  async restore (extract_dir, plugin_name) {
    try {
      var backup_clients_ini_path = path.join(extract_dir, 'plugins', plugin_name, 'pppoe-clients.ini')
      if (await fs.pathExists(backup_clients_ini_path)) {
        var backup_clients = await clients.read(backup_clients_ini_path)
        await promiseSeries(backup_clients.map(c => {
          return async () => {
            try {
              await clients.createClient(c)
            } catch (e) {
              // client skipped
            }
          }
        }))
      }

      var backup_config_ini_path = path.join(extract_dir, 'plugins', plugin_name, 'pppoe-config.ini')
      if (await fs.pathExists(backup_config_ini_path)) {
        await fs.copy(backup_config_ini_path, config_ini_path)
      }
    } catch (e) {}
  }
}
