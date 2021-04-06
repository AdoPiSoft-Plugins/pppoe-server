'use strict';

var { bills_manager } = require("../../core.js")
var Bill = require("../bill.js")
const promiseSeries = require("promise.series")
const clients = require("../clients.js")
const INTERVAL = 1000*60*60*5 //run every 5hrs
const INITIAL_TIMEOUT = 20000 //20s

exports.init = async()=>{
  setTimeout(async()=>{
    await exports.tick()
  }, INITIAL_TIMEOUT)

  setInterval(async()=>{
    await exports.tick()
  }, INTERVAL)
}

exports.tick = async()=>{
  let list = (await clients.read()).filter(l => l.auto_bill )
  var today = new Date()

  await promiseSeries(list.map(client=>{
    return async()=>{
      try{
        var due_date = new Date(client.expiration_date)
        var billing_date = new Date(due_date.getTime())
        billing_date.setDate(client.billing_date)

        var ref_number = [s.index, due_date.getTime()].join('')

        if(today >= billing_date){
          if(await bills_manager.isPaid(ref_number)) return
          var bill = await bills_manager.find(ref_number)

          if(!bill){
            bill = new Bill(ref_number, {account: client, due_date})
            await bills_manager.add(bill)

            bill.on("paid", (bill)=>{})
          }
          await bills_manager.updateBill(ref_number)
        }

      }catch(e){}
    }
  }))
}