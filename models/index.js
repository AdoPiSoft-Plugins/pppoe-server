"use strict";var{dbi,machine_id}=require("plugin-core"),PppoeAccount=require("./pppoe_account.js"),model_files={PppoeAccount:PppoeAccount};exports.init=async()=>{if(dbi){for(var{sequelize,Sequelize}=dbi,db=await sequelize.getInstance(),keys=Object.keys(model_files),i=0;i<keys.length;i++){var k=keys[i];dbi.models[k]=model_files[k](db,Sequelize);try{await dbi.models[k].sync({alter:!0})}catch(e){}}return dbi.models.PppoeAccount.addScope("default_scope",{where:{machine_id:machine_id}}),dbi}};