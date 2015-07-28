var async = require('async');
var http = require('./httpAgent.js');
var baiduAk = '12323';

function getCity(stationName, callback) {
	var url = 'http://api.baidu.com/getcity';
	var body = {

	}

	var handler = function(err, statusCode, data) {
		log.trace(statusCode);
		log.trace(data);

		callback('shanghai');
	}；

	http.post(url, body, handler);
} 

function getDistance(stationA, stationB, cityA, cityB, callback) {
	var url = 'http://www.baidu.com/...';
	var body = {
		origin : stationA,
		destination : stationB,
		mode : 'driving',
		origin_region : cityA,
		destination_region : cityB,
		output : 'json',
		ak : baiduAk
	};

	var handler = function(err, statusCode, data) {
		log.trace(statusCode);
		log.trace(data);

		callback(1000);
	};

	http.post(url, body, handler);
}

function getCoachPath(fromStation, toStation, callback) {

} 
