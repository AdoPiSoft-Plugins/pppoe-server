(function () {
  'use strict';

  var App = angular.module('Plugins')

  App.service('PPPOEService', [
    '$http',
    'toastr',
    'CatchHttpError',
    '$q',
    function($http, toastr, CatchHttpError, $q) {

      this.clients = function () {
        return $http.get('/pppoe-server/clients').catch(CatchHttpError);
      }

      this.settings = function() {
        return $http.get('/pppoe-server/settings').catch(CatchHttpError);
      }

      this.updateSettings = function(cfg) {
        return $http.post('/pppoe-server/settings', cfg).catch(CatchHttpError);
      }

      this.createClient = function(cfg) {
        return $http.post('/pppoe-server/clients', cfg)
      }

      this.updateClient = function(index, cfg) {
        return $http.post('/pppoe-server/clients/'+index, cfg)
      }

      this.deleteClient = function(index){
        return $http.delete('/pppoe-server/clients/'+index).catch(CatchHttpError);
      }

      this.fetchBill = function(index){
        return $http.get('/pppoe-server/clients/'+index+'/update-bill').catch(CatchHttpError);
      }
    }
  ])

})();
