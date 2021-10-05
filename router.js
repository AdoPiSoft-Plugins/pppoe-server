'use strict'

var core = require('plugin-core')
var { router, middlewares } = core
var { express, bodyParser, act } = middlewares
var pppoe_server_ctrl = require('./controllers/pppoe_server_ctrl.js')
var backup_restore_ctrl = require('./controllers/backup_restore_ctrl.js')

router.get('/pppoe-server/clients', express.urlencoded({ extended: true }), bodyParser.json(), core.middlewares.auth, pppoe_server_ctrl.clients)
router.get('/pppoe-server/settings', express.urlencoded({ extended: true }), bodyParser.json(), core.middlewares.auth, pppoe_server_ctrl.settings)
router.post('/pppoe-server/settings', act, express.urlencoded({ extended: true }), bodyParser.json(), core.middlewares.auth, pppoe_server_ctrl.updateSettings)
router.post('/pppoe-server/clients', act, express.urlencoded({ extended: true }), bodyParser.json(), core.middlewares.auth, pppoe_server_ctrl.createClient)
router.post('/pppoe-server/clients/:id', act, express.urlencoded({ extended: true }), bodyParser.json(), core.middlewares.auth, pppoe_server_ctrl.updateClient)
router.delete('/pppoe-server/clients/:id', act, express.urlencoded({ extended: true }), bodyParser.json(), core.middlewares.auth, pppoe_server_ctrl.deleteClient)
router.get('/pppoe-server/clients/:id/update-bill', express.urlencoded({ extended: true }), bodyParser.json(), core.middlewares.auth, pppoe_server_ctrl.updateBill)
router.get('/pppoe-server/on-connected', express.urlencoded({ extended: true }), bodyParser.json(), pppoe_server_ctrl.onConnected)
router.get('/pppoe-server/on-disconnected', express.urlencoded({ extended: true }), bodyParser.json(), pppoe_server_ctrl.onDisconnected)
router.post('/pppoe-server/restore', express.urlencoded({ extended: true }), bodyParser.json(), backup_restore_ctrl.restore)
module.exports = router
