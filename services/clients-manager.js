var clients=require("../clients.js"),config=require("../config.js"),path=require("path"),cmd=require("../lib/cmd.js"),promiseSeries=require("promise.series"),{dbi}=require("plugin-core"),CONNECTED="connected",DISCONNECTED="disconnected",TICK_INTERVAL=6e4;exports.init=async()=>{setInterval(async()=>{var ppp_ifaces="";try{await cmd(`${path.join(__dirname,"..","scripts","list-ppp.sh")}`,{onData:o=>{ppp_ifaces+=o}})}catch(e){}var list=await clients.listAll();await promiseSeries(list.map(client=>async()=>{let exp_date=client.expiration_date?new Date(client.expiration_date):null;exp_date instanceof Date&&exp_date.getTime()>(new Date).getTime()||!client.expiration_date&&!client.expire_minutes?ppp_ifaces.includes(client.ip_address)&&client.status!=CONNECTED&&await exports.connect({ip:client.ip_address,iface:client.iface}):await exports.disconnect({ip:client.ip_address,iface:client.iface,is_expired:!0})}))},TICK_INTERVAL);var all=await clients.listAll();await promiseSeries(all.map((c,i)=>async()=>{c.status=DISCONNECTED,await clients.updateClient(c.id,c)}))},exports.connect=async({ip:wan_iface,iface})=>{var client=await dbi.models.PppoeAccount.scope(["default_scope"]).findOne({where:{ip_address:wan_iface},raw:!0});if(!client)return exports.disconnect({ip:wan_iface,iface:iface});if(client.status=CONNECTED,client.iface=iface,0<client.expire_minutes)client.expiration_date=new Date((new Date).getTime()+6e4*client.expire_minutes),client.expire_minutes=0;else{let exp_date=client.expiration_date?new Date(client.expiration_date):null;if(!(exp_date instanceof Date&&exp_date.getTime()>(new Date).getTime()||!client.expiration_date&&!client.expire_minutes))return exports.disconnect({ip:wan_iface,iface:iface,is_expired:!0})}client.started_at||(client.started_at=new Date);var{wan_iface}=await config.read();await clients.updateClient(client.id,client),await cmd(`${path.join(__dirname,"..","scripts","connect.sh")} ${iface} ${wan_iface} ${client.max_download||0} ${client.max_upload||0}`).catch(console.log)},exports.disconnect=async({ip:client,iface,is_expired:wan_iface})=>{client=await dbi.models.PppoeAccount.findOne({where:{ip_address:client},raw:!0});if(client){if(!wan_iface)if(await new Promise(resolve=>setTimeout(resolve,3e4)),await new Promise(resolve=>{try{var res="";cmd("ls /sys/class/net",{onData:o=>{res+=o}}).then(()=>{resolve(res.includes(iface))})}catch(e){resolve()}}))return;client.status=DISCONNECTED;var{wan_iface}=await config.read();client.iface&&await cmd(`${path.join(__dirname,"..","scripts","disconnect.sh")} ${iface} ${wan_iface}`).catch(console.log),client.iface=null,await clients.updateClient(client.id,client)}};