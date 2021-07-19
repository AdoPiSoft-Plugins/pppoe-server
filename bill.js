var core = require('plugin-core')
var { machine_id } = core
const UNPAID = 'unpaid'
const PAID = 'paid'
const clients = require('./clients.js')
const EventEmitter = require('events')

class Bill extends EventEmitter {
  constructor (ref_number, {account, due_date}) {
    super()
    this.pppoe_account = account
    this.subscription_type = 'pppoe'
    this.ref_number = ref_number
    this.due_date = due_date
    this.amount = account.billing_amount
    this.phone_number = account.billing_phone_number
    this.machine_id = machine_id
    this.status = UNPAID
    this.account_number = this.generateAccountNumber() // should be place in the bottom
  }

  generateAccountNumber () {
    var mlen = (this.machine_id + '').length
    var plen = (this.phone_number + '').length
    return [this.machine_id.substr(0, 2), this.machine_id.substr(mlen - 2, mlen), this.phone_number.substr(1, plen)].join('')
  }

  async markPaid (payment) {
    this.status = PAID
    await this.renew(payment.transaction_id)
    this.emit('paid', this)
  }

  async renew (transaction_id) {
    var next_exp = new Date()
    let acc = this.pppoe_account
    next_exp.setDate(acc.billing_due_date)
    if (next_exp <= new Date() || next_exp <= acc.expiration_date) {
      next_exp.setMonth(next_exp.getMonth() + 1)
    }
    acc.expiration_date = next_exp
    await clients.updateClient(acc.index, acc)
  }
}

module.exports = Bill
