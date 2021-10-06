var csv = require('csvtojson')
var clients = require('../clients.js')

exports.import = async (req, res, next) => {
  try {
    let file = req.files.file
    let data = await csv().fromFile(file.tempFilePath)
    let count = 0
    let skipped = 0
    for (let c of data) {
      let username = c['Username'] || c['username']
      let password = c['Password'] || c['password']
      if (!username || !password){
        skipped++
        continue
      }
      let ip_address = c['IP Address'] || c['ip address'] || c['Ip Address']
      let max_download = parseInt(c['Max Download'] || c['Download'] || c['download'] || (c['Max']||[])[' Download'] || 0)
      let max_upload = parseInt(c['Max Upload'] || c['Upload'] || c['upload'] || (c['Max']||[])[' Upload'] || 0)
      let started_at = c['Start Time'] || c['Start time']
      let auto_bill = !!String(c['Auto-bill?'] || c['Auto bill'] || c['auto bill']).match(/yes|true/i)
      let billing_phone_number = c['Billing Phone Number'] || c['billing phone number'] || ''
      let billing_date = c['Billing Date'] || c['bill date'] || ''
      let billing_due_date = c['Billing Due Date'] || c['billing due date'] || ''
      let billing_amount = c['Billing Amount'] || c['billing amount'] || ''

      let attrs = {
        username,
        password,
        ip_address,
        max_download,
        max_upload,
        auto_bill,
        billing_phone_number,
        billing_date,
        billing_due_date,
        billing_amount
      }
      if (started_at) attrs.started_at = started_at
      let exp_date = new Date(c['Expiration'])
      let exp_time = String(c['Expiration']).split(':')
      if (exp_date.getTime() > 0) {
        attrs.expiration_date = exp_date
      } else if (exp_time.length >= 3) {
        let t = 0
        for (let i = 0; i < exp_time.length ; i++) {
          let v = parseInt(exp_time[exp_time.length - (1 + i)])
          if (!(v > 0)) continue
          switch(i) {
            case 0: //s
              t += parseInt(v/60)
              break
            case 1: //m
              t += v
              break
            case 2: //h
              t += v*60
              break
            case 3: //d
              t += v*24*60
              break
          }
        }
        if (t > 0){
          attrs.expire_minutes = t
        }
      }
      try {
        console.log(c)
        console.log(attrs)
        await clients.createClient(attrs)
        count++
      } catch (e) {
        skipped++
      }
    }
    res.json({count, skipped})
  } catch (e) {
    next(e)
  }
}
