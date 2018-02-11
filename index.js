const https = require('https');
const fs = require('fs-extra');
const unzip = require('unzip');
const git = require('simple-git');

//const start= "February 3, 2017";
const start= "February 1, 2018";

var date = new Date(Date.parse(start));
var today = new Date();

const datadir = 'data/';

while(date <= today){
	// Zero pad day and month values
	var day = date.getDate().toLocaleString('en',{minimumIntegerDigits:2});
	var month = (date.getMonth()+1).toLocaleString('en',{minimumIntegerDigits:2});
	var year = date.getFullYear();
	var dir = year + "-" + month + "-" + day;
	console.log("Checking " + dir);
	fs.ensureDir(datadir + dir, ensureDirCB(datadir,dir));
	// Updates are released weekly but sometimes its not exactly one week so we have to check every single day
	date = dateAdd(date,'day',1);
}

function ensureDirCB(datadir, dir){
	return function(err){
		if(err)
			console.log(err);
		fs.pathExists(datadir + dir + "/agency.txt",pathExistsCB(datadir,dir));
	}
}

function pathExistsCB(datadir, dir){
	return function(err, exists){
		if(err)
			console.log(err);
		if(!exists){
			console.log("Data for " + dir + " doesn't exist, downloading...");
			var file = fs.createWriteStream(datadir + dir + "/google_transit.zip");
			var request = https.get("https://developer.translink.ca/GTFS/" + dir + "/google_transit.zip", (response) => {
				response.pipe(file);
				file.on('finish',() => {
					console.log("Downloaded data for " + dir + ",extracting...");
					fs.createReadStream(datadir + dir + "/google_transit.zip").pipe(unzip.Extract({ path: datadir + dir + "/" })
						.on('finish',() =>{
							console.log("Data for " + dir + " extracted, cleaning up...");	
							fs.unlink(datadir + dir + "/google_transit.zip");
						}).on("error",(err) => {
							//console.log(err);
							console.log("Error extracting data for " + dir + ", assuming folder doesnt exist");
							fs.remove(datadir + dir + "/");
						}));
				});
			}).on("error", (err) => {
				console.log(err);
				console.log("Error downloading data for " + dir);
				fs.unlink(datadir + dir + "/google_transit.zip");
			});
		} else {
			console.log("Data for " + dir + " already exists");
		}
	}
}

//var request = http.get("http://ns.translink.ca/gtfs/google_transit.zip", (response) => {

function dateAdd(date, interval, units) {
  var ret = new Date(date); //don't change original date
  var checkRollover = function() { if(ret.getDate() != date.getDate()) ret.setDate(0);};
  switch(interval.toLowerCase()) {
    case 'year'   :  ret.setFullYear(ret.getFullYear() + units); checkRollover();  break;
    case 'quarter':  ret.setMonth(ret.getMonth() + 3*units); checkRollover();  break;
    case 'month'  :  ret.setMonth(ret.getMonth() + units); checkRollover();  break;
    case 'week'   :  ret.setDate(ret.getDate() + 7*units);  break;
    case 'day'    :  ret.setDate(ret.getDate() + units);  break;
    case 'hour'   :  ret.setTime(ret.getTime() + units*3600000);  break;
    case 'minute' :  ret.setTime(ret.getTime() + units*60000);  break;
    case 'second' :  ret.setTime(ret.getTime() + units*1000);  break;
    default       :  ret = undefined;  break;
  }
  return ret;
}
