(function () {
  'use strict'
  var App = angular.module('Plugins')
  App.controller('PPPOEServerCtrl', function ($scope, PPPOEService, Interfaces, $uibModal, toastr, $filter) {
    $scope.loadClients = function () {
      $scope.loading = true
      $scope.import = {file: null}
      return PPPOEService.clients().then(function (resp) {
        var clients = resp.data || []
        clients.forEach(function (c) {
          c.expire_minutes = parseInt(c.expire_minutes)
          c.max_download = parseInt(c.max_download)
          c.max_upload = parseInt(c.max_upload)
          c.billing_amount = parseInt(c.billing_amount)
          c.billing_date = parseInt(c.billing_date)
          c.billing_due_date = parseInt(c.billing_due_date)

          if (c.expiration_date && !c.expire_minutes) {
            c.expiration_date = new Date(c.expiration_date)
            c.is_expired = c.expiration_date.getTime() <= new Date().getTime()
          }
          return c
        })
        $scope.clients = clients
      }).finally(function () {
        $scope.loading = false
      })
    }
    $scope.loadClients()

    PPPOEService.settings().then(function (resp) {
      $scope.settings = resp.data || {}
      Interfaces.all().then(function (res) {
        var list = res.data || []
        $scope.interfaces = list.filter(function (d) {
          d.config = d.config || {}
          d.info = d.info || {}
          return d.config.enable_bandwidth_limiter || d.config.captiveportal && !d.info.bridged
        })
        var wan_iface = list.find(function (i) {
          return i.config.type === 'wan'
        }) || {interface: 'eth0'}

        $scope.settings.wan_iface = wan_iface.interface
      })
    })

    $scope.updateSettings = function () {
      $scope.saving = true
      PPPOEService.updateSettings($scope.settings).then(function () {
        toastr.success('PPPOE Settings successfully saved')
      }).finally(function () {
        $scope.saving = false
      })
    }

    $scope.clientModal = function (params) {
      $uibModal.open({
        templateUrl: params.template,
        controller: function ($scope, PPPOEService, $uibModalInstance, CatchHttpError) {
          $scope.opts = {
            expiration_units: ['hours', 'days'],
            expiration_unit: 'days',
            expire_hours: 30,
            valid_time: false
          }

          var client = params.client
          $scope.id = params.id
          if (client) {
            $scope.username = client.username
            $scope.password = client.password
            $scope.max_download = client.max_download
            $scope.max_upload = client.max_upload
            $scope.expire_minutes = client.expire_minutes
            $scope.expiration_date = client.expiration_date
            $scope.no_expiration = !client.expire_minutes && !client.expiration_date
            $scope.is_expired = client.is_expired
            $scope.auto_bill = !!client.auto_bill
            $scope.billing_amount = client.billing_amount
            $scope.billing_phone_number = client.billing_phone_number
            $scope.billing_date = client.billing_date
            $scope.billing_due_date = client.billing_due_date

            if ($scope.expire_minutes >= 1440) {
              var days = ($scope.expire_minutes / 60) / 24
              if (days % 1 == 0) {
                $scope.opts.expiration_unit = 'days'
                $scope.opts.expire_hours = days
              } else {
                $scope.opts.expiration_unit = 'hours'
                $scope.opts.expire_hours = $scope.expire_minutes / 60
              }
            } else {
              $scope.opts.expiration_unit = 'hours'
              $scope.opts.expire_hours = $scope.expire_minutes > 0 ? $scope.expire_minutes / 60 : 24
            }
          } else {
            $scope.username = ''
            $scope.password = ''
          }

          $scope.computeExpMinutes = function () {
            $scope.expire_minutes = !$scope.no_expiration
              ? ($scope.opts.expiration_unit == 'hours'
                  ? $scope.opts.expire_hours * 60
                  : $scope.opts.expire_hours * 60 * 24
                )
              : null
          }

          $scope.recomputeExpiration = function () {
            $scope.computeExpMinutes()
          }

          $scope.createClient = function () {
            $scope.submitting = true
            var client = {
              username: $scope.username,
              password: $scope.password,
              max_download: $scope.max_download,
              max_upload: $scope.max_upload,
              expire_minutes: $scope.no_expiration ? 0 : $scope.expire_minutes,
              auto_bill: $scope.auto_bill,
              billing_amount: $scope.billing_amount,
              billing_phone_number: $scope.billing_phone_number,
              billing_date: $scope.billing_date,
              billing_due_date: $scope.billing_due_date
            }
            PPPOEService.createClient(client).then(function () {
              toastr.success('PPPOE Client successfully created')
              $uibModalInstance.close()
            }).catch(CatchHttpError).finally(function () {
              $scope.submitting = false
            })
          }

          $scope.updateClient = function () {
            $scope.submitting = true
            client.username = $scope.username
            client.password = $scope.password
            client.max_download = $scope.max_download
            client.max_upload = $scope.max_upload
            client.expire_minutes = $scope.no_expiration ? 0 : !$scope.expiration_date ? $scope.expire_minutes : 0

            client.auto_bill = $scope.auto_bill
            client.billing_amount = $scope.billing_amount
            client.billing_phone_number = $scope.billing_phone_number
            client.billing_date = $scope.billing_date
            client.billing_due_date = $scope.billing_due_date

            if ($scope.extend_expiration) {
              client.expire_minutes = 0
              var exp_date = client.expiration_date ? new Date(client.expiration_date) : new Date()
              if (isNaN(exp_date.getTime())) exp_date = new Date()

              client.expiration_date = new Date(exp_date.getTime() + $scope.expire_minutes * 60000)
            }

            if ($scope.no_expiration) {
              client.expire_minutes = 0
              delete client.expiration_date
            }
            delete client.is_expired

            PPPOEService.updateClient($scope.id, client).then(function () {
              toastr.success('PPPOE Client successfully updated')
              $uibModalInstance.close()
            }).catch(CatchHttpError).finally(function () {
              $scope.submitting = false
            })
          }
        },
        backdrop: 'static',
        scope: $scope
      }).result
        .then(function () {
          $scope.loadClients()
        })
    }

    $scope.newClient = function () {
      return $scope.clientModal({
        template: '/public/plugins/pppoe-server/views/clients/new.html'
      })
    }

    $scope.editClient = function (id, client) {
      return $scope.clientModal({
        template: '/public/plugins/pppoe-server/views/clients/edit.html',
        id: id,
        client: client
      })
    }

    $scope.updateClient = function (id, client) {
      $scope.updating = true
      PPPOEService.updateClient(id, client).then(function () {
        toastr.success('PPPOE Client successfully updated')
      }).finally(function () {
        $scope.updating = false
      })
    }

    $scope.deleteClient = function (id) {
      $scope.deleting = true
      if (!confirm('Are you sure you want to delete this Client?')) return
      PPPOEService.deleteClient(id).then(function () {
        toastr.success('PPPOE Client successfully deleted')
      }).finally(function () {
        $scope.deleting = false
        $scope.loadClients()
      })
    }

    $scope.fetchBill = function (id) {
      $scope.fetchingBill = id
      PPPOEService.fetchBill(id).finally(function () {
        $scope.loadClients()
        $scope.fetchingBill = null
      })
    }

    $scope.downloadBackup = function () {
      var txt = 'Username, Password, IP Address, Max. Download, Max. Upload, Start Time, Expiration, Auto-bill?, Billing Phone Number, Billing Date, Billing Due Date, Billing Amount\r\n'
      $scope.clients.forEach(function (c, i) {
        c = Object.assign({}, c)
        if (i > 0) txt += '\r\n'

        txt += c.username + ','
        txt += c.password + ','
        txt += c.ip_address + ','
        txt += c.max_download + ','
        txt += c.max_upload + ','
        txt += (c.started_at || '') + ','
        txt += $filter('expirationtext')({expire_minutes: c.expire_minutes, expiration_date: c.expiration_date}) + ','
        txt += (c.auto_bill ? 'Yes' : 'No') + ','
        txt += (c.billing_phone_number || '') + ','
        txt += (c.billing_date || '') + ','
        txt += (c.billing_due_date || '') + ','
        txt += c.billing_amount || ''
      })
      var file_type = 'text/csv;charset=utf-8'
      var blob = new Blob([txt], {type: file_type})
      saveAs(blob, 'pppoe-accounts.csv')
    }

    $scope.$watch('import.file', function (file) {
      console.log(file)
    })
  })
})()
