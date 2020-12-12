(function () {
  'use strict';
  var App = angular.module('Plugins')
  .config(function($stateProvider) {
    $stateProvider
    .state('plugins.pppoe_server', {
      templateUrl : "/plugins/pppoe-server/views/index.html",
      controller: 'PPPOEServerCtrl',
      url: '/pppoe-server',
      title: 'PPPOE Server',
      sidebarMeta: {
        order: 3,
      },
    });
  });
})();
