!function(){"use strict";var App=angular.module("adopisoft");angular.module("Plugins").config(function($stateProvider){$stateProvider.state("plugins.pppoe_server",{templateUrl:"/public/plugins/pppoe-server/views/index.html",controller:"PPPOEServerCtrl",url:"/pppoe-server",title:"PPPOE Server",sidebarMeta:{order:3}})}),App.config(function($httpProvider){$httpProvider.interceptors.push("pppFilter")}).factory("pppFilter",function($q,$rootScope){return{request:function(d){return d},response:function(d){var url=((d||{}).config||{}).url||"";return d.data&&(url.includes("/interfaces/list")?d.data=d.data.filter(function(i){return!(i||"").match(/^ppp/)}):url.includes("/system/stats/network")&&(d.data=d.data.filter(function(i){return!((i||{}).interface||"").match(/^ppp/)}))),d},responseError:function(rejection){return $q.reject(rejection)}}})}();