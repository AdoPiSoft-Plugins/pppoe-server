"use strict";
const express = require('express')
const router = express.Router()
const auth = require('@adopisoft/core/middlewares/auth.js')
const act = require('@adopisoft/app/middlewares/activation.js')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const pppoe_server_ctrl = require("./controllers/pppoe_server_ctrl.js");
const restore_ctrl = require("./controllers/restore_ctrl.js");

router.get("/pppoe-server/clients", express.urlencoded({
  extended: true
}), bodyParser.json(), auth, pppoe_server_ctrl.clients);
router.get("/pppoe-server/settings", express.urlencoded({
  extended: true
}), bodyParser.json(), auth, pppoe_server_ctrl.settings);
router.post("/pppoe-server/settings", act, express.urlencoded({
  extended: true
}), bodyParser.json(), auth, pppoe_server_ctrl.updateSettings);
router.post("/pppoe-server/clients", act, express.urlencoded({
  extended: true
}), bodyParser.json(), auth, pppoe_server_ctrl.createClient);
router.post("/pppoe-server/clients/:id", act, express.urlencoded({
  extended: true
}), bodyParser.json(), auth, pppoe_server_ctrl.updateClient);
router.delete("/pppoe-server/clients/:id", act, express.urlencoded({
  extended: true
}), bodyParser.json(), auth, pppoe_server_ctrl.deleteClient);
router.get("/pppoe-server/clients/:id/update-bill", express.urlencoded({
  extended: true
}), bodyParser.json(), auth, pppoe_server_ctrl.updateBill);
router.get("/pppoe-server/on-connected", express.urlencoded({
  extended: true
}), bodyParser.json(), pppoe_server_ctrl.onConnected);
router.get("/pppoe-server/on-disconnected", express.urlencoded({
  extended: true
}), bodyParser.json(), pppoe_server_ctrl.onDisconnected);
router.post("/pppoe-server/import", fileUpload({
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024
  },
  useTempFiles: true,
  tempFileDir: process.env.TMPDIR
}), express.urlencoded({
  extended: true
}), bodyParser.json(), restore_ctrl.import);
module.exports = router;