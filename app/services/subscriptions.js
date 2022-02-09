const {machine} = require('@adopisoft/exports')
const bills_manager = require('@adopisoft/core/bills_manager')
const Bill = require("../bill.js");
const promiseSeries = require("promise.series");
const clients = require("../clients.js");
const INTERVAL = 1e3 * 60 * 60 * 5;
const INITIAL_TIMEOUT = 2e4;
exports.init = async() => {
  setTimeout(async() => {
    await exports.tick()
  }, INITIAL_TIMEOUT);
  setInterval(async() => {
    await exports.tick()
  }, INTERVAL)
};
exports.tick = async() => {
  let list = (await clients.listAll()).filter(l => l.auto_bill);
  await promiseSeries(list.map(client => {
    return async() => {
      await exports.generateBill(client)
    }
  }))
};
exports.generateBill = async client => {
  try {
    const machine_id = await machine.getId()
    var today = new Date;
    var due_date = new Date(client.expiration_date);
    var billing_date = new Date(due_date.getTime());
    billing_date.setDate(client.billing_date);
    var ref_number = [client.id, due_date.getTime()].join("");
    if (today >= billing_date) {
      if (await bills_manager.isPaid(ref_number)) return;
      var bill = await bills_manager.find(ref_number);
      if (!bill) {
        bill = new Bill(ref_number,machine_id, {
          account: client,
          due_date: due_date
        });
        await bills_manager.add(bill);
        bill.on("paid", bill => {})
      }
      await bills_manager.updateBill(ref_number)
    }
  } catch (e) {
    console.log(e)
  }
};