var model_name = 'PppoeAccount'
var table_name = 'pppoe_accounts'
var opts = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  timestamps: true,
  tableName: table_name
}

module.exports = (sequelize, Sequelize) => {
  var model = sequelize.define(model_name, {
    id: {
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      unique: true
    },
    machine_id: {
      type: Sequelize.STRING
    },
    username: {
      type: Sequelize.STRING
    },
    password: {
      type: Sequelize.STRING
    },
    ip_address: {
      type: Sequelize.STRING
    },
    iface: {
      type: Sequelize.STRING
    },
    billing_phone_number: {
      type: Sequelize.STRING
    },
    auto_bill: {
      type: Sequelize.BOOLEAN
    },
    billing_due_date: {
      type: Sequelize.INTEGER
    },
    billing_amount: {
      type: Sequelize.INTEGER
    },
    billing_date: {
      type: Sequelize.INTEGER
    },
    expiration_date: {
      type: Sequelize.DATE
    },
    expire_minutes: {
      type: Sequelize.INTEGER
    },
    max_download: {
      type: Sequelize.INTEGER
    },
    max_upload: {
      type: Sequelize.INTEGER
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE
    }
  }, opts)

  return model
}
