var log = require('./log.js')('location.js');
var http = require('./httpAgent.js');
var URL = require('url');

var baiduApi = {
	host : 'api.map.baidu.com',
	ak : 'kD5pgcIZt0o5izHgB81mZ6uU',
	placeApiPathname : '/place/v2/suggestion'
};


function cmpResult(queryRes, keyword, region, place) {
	if (!queryRes || 
		queryRes.status != 0 ||
		!queryRes.result ||
		!(queryRes.result instanceof Array)) {

		log.trace('baidu ws return data error');
		return false;
	}	

	var dataList = queryRes.result;

	for (idx in dataList) {
		var data = dataList[idx];	
		if (data.name == keyword) {
			if (data.city == place || data.district == place) {
				return true;
			}
		}
	}

	log.trace('no data map what is searched');
	return false;
}

/*
callback(true)  or callback(false)
 */
function isInThePlace(stationName, city, place, callback) {
	var urlObject = {
		protocol : 'http:',
		host : baiduApi.host,
		pathname : baiduApi.placeApiPathname,
		query : {
			query : stationName,
			region : city,
			output : 'json',
			ak : baiduApi.ak
		}
	};

	var url = URL.format(urlObject);
	log.trace(url);

	var handler = function(err, statusCode, data) {
		if (err) {
			log.err(err.name + ':' + err.message);
			callback(false);
			return;
		}

		if (statusCode == 200) {
			callback(cmpResult(data, stationName, city, place));
		} else {
			log.trace('http statusCode: ' + statusCode);
			callback(false);
		}
	};

	http.get(url, handler);
}

module.exports.isInThePlace = isInThePlace;