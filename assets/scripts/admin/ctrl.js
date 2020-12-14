(function () {
  'use strict';
  var App = angular.module('Plugins')
  App.controller('PPPOEServerCtrl', function($scope, PPPOEService, Interfaces, $uibModal, toastr){
    $scope.loadClients = function(){
      $scope.loading = true
      return PPPOEService.clients().then(function(resp){
        var clients = resp.data || []
        clients.forEach(function(c){
          c.expire_minutes = parseInt(c.expire_minutes)
          c.max_download = parseInt(c.max_download)
          c.max_upload = parseInt(c.max_upload)

          if(c.expiration_date){
            c.expiration_date = new Date(c.expiration_date)
            c.is_expired = c.expiration_date.getTime() <= new Date().getTime()
          }
          return c
        })
        $scope.clients = clients
      }).finally(function(){
        $scope.loading = false
      })
    }
    $scope.loadClients()

    PPPOEService.settings().then(function(resp){
      $scope.settings = resp.data || {}
      Interfaces.all().then(function(res) {
        var list = res.data || []
        $scope.interfaces = list.filter(function(d){
          d.config = d.config || {}
          d.info = d.info || {}
          return d.config.enable_bandwidth_limiter || d.config.captiveportal && !d.info.bridged
        })
        var wan_iface = list.find(function(i){
          return i.config.type == 'wan'
        }) || {interface: "eth0"}

        $scope.settings.wan_iface = wan_iface.interface
      })
    })

    $scope.updateSettings = function(){
      $scope.saving = true
      PPPOEService.updateSettings($scope.settings).then(function(){
        toastr.success("PPPOE Settings successfully saved")
      }).finally(function(){
        $scope.saving = false
      })
    }

    $scope.clientModal = function(params){
      $uibModal.open({
        templateUrl: params.template,
        controller: function($scope, PPPOEService, $uibModalInstance, CatchHttpError){
          $scope.opts = {
            expiration_units: ['hours', 'days'],
            expiration_unit: 'days',
            expire_hours: 30,
            valid_time: false
          }

          var client = params.client
          if(client){
            $scope.username = client.username
            $scope.password = client.password
            $scope.max_download = client.max_download
            $scope.max_upload = client.max_upload
            $scope.expire_minutes = client.expire_minutes
            $scope.expiration_date = client.expiration_date
            if($scope.expire_minutes >= 1440){
              var days = ($scope.expire_minutes/60)/24
              if (days % 1 == 0){
                $scope.opts.expiration_unit = 'days'
                $scope.opts.expire_hours = days
              }else{
                $scope.opts.expiration_unit = 'hours'
                $scope.opts.expire_hours = $scope.expire_minutes/60
              }
            }else{
              $scope.opts.expiration_unit = 'hours'
              $scope.opts.expire_hours = $scope.expire_minutes/60
            }
          }

          $scope.computeExpMinutes = function(){
            $scope.expire_minutes =  !$scope.no_expiration
              ? ($scope.opts.expiration_unit == 'hours'
                ? $scope.opts.expire_hours * 60
                : $scope.opts.expire_hours * 60 * 24
              )
              : null
          }

          $scope.recomputeExpiration = function(){
            $scope.computeExpMinutes()
          }

          $scope.createClient = function(){
            $scope.submitting = true
            var client = {
              username: $scope.username,
              password: $scope.password,
              max_download: $scope.max_download,
              max_upload: $scope.max_upload,
              expire_minutes: $scope.expire_minutes,
            }
            PPPOEService.createClient(client).then(function(){
              toastr.success("PPPOE Client successfully created")
              $uibModalInstance.close();
            }).catch(CatchHttpError).finally(function(){
              $scope.submitting = false
            })
          }

          $scope.updateClient = function(){
            $scope.submitting = true
            client.username = $scope.username
            client.password = $scope.password
            client.max_download = $scope.max_download
            client.max_upload = $scope.max_upload
            client.expire_minutes = !$scope.expiration_date? $scope.expire_minutes : 0
            delete client.is_expired

            PPPOEService.updateClient(params.index, client).then(function(){
              toastr.success("PPPOE Client successfully updated")
              $uibModalInstance.close();
            }).catch(CatchHttpError).finally(function(){
              $scope.submitting = false
            })
          }
        },
        scope: $scope,
      }).result
      .then(function() {
        $scope.loadClients()
      });
    }

    $scope.newClient = function(){
      return $scope.clientModal({
        template: '/plugins/pppoe-server/views/clients/new.html'
      })
    }

    $scope.editClient = function(index, client){
      return $scope.clientModal({
        template: '/plugins/pppoe-server/views/clients/edit.html',
        index: index,
        client: client
      })
    }

    $scope.updateClient = function(index, client){
      $scope.updating = true
      PPPOEService.updateClient(index, client).then(function(){
        toastr.success("PPPOE Client successfully updated")
      }).finally(function(){
        $scope.updating = false
      })
    }

    $scope.deleteClient = function(index, client){
      $scope.deleting = true
      if(!confirm("Are you sure you want to delete this Client?")) return
      PPPOEService.deleteClient(index).then(function(){
        toastr.success("PPPOE Client successfully deleted")
      }).finally(function(){
        $scope.deleting = false
        $scope.loadClients()
      })
    }
  })
})();
