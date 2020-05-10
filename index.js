const sensor = require('ds18b20-raspi')
const ZabbixSender = require('node-zabbix-sender')
const fs = require('fs')
const path  = require('path')

function getSettings(){
	return new Promise((res,rej)=> {
		fs.readFile(path.join(__dirname, 'settings.json'), 'utf-8', (err, content)=>  {
			if(err){
				rej(err);
	
			} else {
				res(JSON.parse(content))
			}

		})

	}
)}

getSettings()
	.then(settings=> {
		console.log(settings)
		if(settings.repeat){
			sendResults(settings)
			setInterval(() =>{
				sendResults(settings);
			}, settings.timeout*1000)
		} else {
			sendResults(settings)
		}
		
	})
	.catch(err=> console.log(err))








function sendResults(settings){
	const sender = new ZabbixSender({
		host : settings.server
	})

	sensor.list((err, devIDs) =>{
		if(err){
			console.log('ds18b20 sensors not found')
			// send error to zabbix 
		} else{
			console.log(devIDs)
			let index = 0
			devIDs.forEach(id => {
				sensor.readC(id, (err, temp) => {
					if(err){
						//send error to zabbix
						console.log(`Error  reading from ${id} sensor`);

					} else{
						console.log(`Temperature from ${id} / ${index} : ${temp}`)
						sender.addItem(settings.host,`temp${index}`,temp).send((err, res)=>{
							if(err) {
								console.log(err)
							} else {
								console.log(res)
							}
						})
					}
					index++
				})
				
			})

		}});
}

