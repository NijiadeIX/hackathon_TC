var log = require('./log.js')('api');
var md5 = require('md5');

function generalSign(action, from, to, date, format, user, reqtime, key) {
	var rawSign = action + ',' + from + ',' + to 
		+ ',' + date + ',' + format + ',' 
		+ user + ',' + reqtime + ',' + key;

	return md5(rawSign);
}

var a = generalSign('zhanzhan', 'nanning', 'baei', 'json', 'hack', '1234', 'asdfasfd');
console.log(a);