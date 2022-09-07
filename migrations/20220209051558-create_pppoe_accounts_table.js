'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
   return queryInterface.createTable('pppoe_accounts', {
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
    status: {
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
    started_at: {
      type: Sequelize.DATE
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE
    }
   })
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('pppoe_accounts')
  }
};
