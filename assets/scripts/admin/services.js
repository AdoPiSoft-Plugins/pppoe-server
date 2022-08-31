(function() {
    "use strict";
    var App = angular.module("Plugins");
    App.service("PPPOEService", ["$http", "toastr", "CatchHttpError", "$q", function($http, toastr, CatchHttpError, $q) {
        this.clients = function(sort) {
            return $http.get("/pppoe-server/clients", {params: sort}).catch(CatchHttpError)
        };
        this.settings = function() {
            return $http.get("/pppoe-server/settings").catch(CatchHttpError)
        };
        this.updateSettings = function(cfg) {
            return $http.post("/pppoe-server/settings", cfg).catch(CatchHttpError)
        };
        this.createClient = function(cfg) {
            return $http.post("/pppoe-server/clients", cfg)
        };
        this.updateClient = function(id, cfg) {
            return $http.post("/pppoe-server/clients/" + id, cfg)
        };
        this.deleteClient = function(id) {
            return $http.delete("/pppoe-server/clients/" + id).catch(CatchHttpError)
        };
        this.fetchBill = function(id) {
            return $http.get("/pppoe-server/clients/" + id + "/update-bill").catch(CatchHttpError)
        }
    }])
})();