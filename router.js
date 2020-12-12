'use strict'

var core = require('../core')
var { router, middlewares } = core
var { express, bodyParser } = middlewares
var pppoe_server_ctrl = require('./controllers/pppoe_server_ctrl.js')

router.get('/pppoe-server/clients', express.urlencoded({ extended: true }), bodyParser.json(), core.middlewares.auth, pppoe_server_ctrl.clients)
router.get('/pppoe-server/settings', express.urlencoded({ extended: true }), bodyParser.json(), core.middlewares.auth, pppoe_server_ctrl.settings)
router.post('/pppoe-server/settings', express.urlencoded({ extended: true }), bodyParser.json(), core.middlewares.auth, pppoe_server_ctrl.updateSettings)
router.post('/pppoe-server/clients', express.urlencoded({ extended: true }), bodyParser.json(), core.middlewares.auth, pppoe_server_ctrl.createClient)
router.post('/pppoe-server/clients/:index', express.urlencoded({ extended: true }), bodyParser.json(), core.middlewares.auth, pppoe_server_ctrl.updateClient)
router.delete('/pppoe-server/clients/:index', express.urlencoded({ extended: true }), bodyParser.json(), core.middlewares.auth, pppoe_server_ctrl.deleteClient)

module.exports = router
