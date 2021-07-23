(function () {
  'use strict';
  var App = angular.module("adopisoft")
  angular.module('Plugins')
  .config(function($stateProvider) {
    $stateProvider
    .state('plugins.pppoe_server', {
      templateUrl : "/public/plugins/pppoe-server/views/index.html",
      controller: 'PPPOEServerCtrl',
      url: '/pppoe-server',
      title: 'PPPOE Server',
      sidebarMeta: {
        order: 3,
      },
    });
  });

  // exclude ppp client interfaces from iface list
  App.config(function ($httpProvider) {
    $httpProvider.interceptors.push("pppFilter");
  })
  .factory("pppFilter", function($q, $rootScope){
    var service = {
      request: function(d){
        return d
      },
      response: function(d) {
        var url = ((d||{}).config||{}).url || ""
        if(!d.data) return d

        if(url.includes('/interfaces/list')){
          d.data = d.data.filter(function(i){
            return !(i||"").match(/^ppp/)
          })
        }else if(url.includes("/system/stats/network")){
          d.data = d.data.filter(function(i){
            return !((i||{}).interface||"").match(/^ppp/)
          })
        }

        return d
      },
      responseError: function(rejection) {
        return $q.reject(rejection);
      }
    };
    return service;

  });

})();
