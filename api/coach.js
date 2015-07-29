var async = require('async');
var URL   = require('url');
var http  = require('./httpAgent.js');
var log   = require('./log.js')('coach.js');

//百度api接口配置
var baiduInterface = {
	host : 'api.map.baidu.com',
	ak : 'kD5pgcIZt0o5izHgB81mZ6uU',
	getTimePathName : '/direction/v1/routematrix'
};

//携程汽车票查询接口
var ctripInterface = {
	host : 'ws.shopping.qiche.uat.qa.nt.ctripcorp.com',
	stationToStationPathName : '/index.php'
};

/**
 * 调用百度api，查询从一个城市到另一个城市驾车所需时间
 * @param  {string}   cityA    [description]
 * @param  {string}   cityB    [description]
 * @param  {Function} callback function(time)
 */
function _getTime(cityA, cityB, callback) {
	var urlObject = {
		protocol : 'http:',		
		host : baiduInterface.host,
		pathname : baiduInterface.getTimePathName,
		query : {
			origins : cityA,
			destinations : cityB,
			mode : 'driving',
			output : 'json',
			ak : baiduInterface.ak
		}
	};

	var url = URL.format(urlObject);
	log.trace(url);

	var handler = function(err, statusCode, data) {
		log.trace(statusCode);
		log.trace(data);

		var time = 0;

		if (err) {
			log.error('_getTime> ' + err.name + ':' + err.message);
			callback(time);
			return;
		}

		if (statusCode == 200) {
			if (data.result && 
				data.result.elements && 
				data.result.elements.duration && 
				data.result.elements.duration.value) {

				time = data.result.elements.duration.value;
			}
		}

		callback(time);
	};

	http.get(url, handler);
}

/**
 * 获取城市到城市的汽车班次，但不包括行车时间
 * @param  {[type]}   stationA  [description]
 * @param  {[type]}   cityA     [description]
 * @param  {[type]}   stationB  [description]
 * @param  {[type]}   cityB     [description]
 * @param  {[type]}   startDate [description]
 * @param  {Function} callback  [description]
 */
function _getCoachPath(stationA, cityA, stationB, cityB, startDate, callback) {
	var urlObject = {
		protocol : 'http:',
		host : ctripInterface.host,
		pathname : ctripInterface.stationToStationPathName,
		param : '/bus/busList',
		from : cityA,
		to : cityB,
		date : startDate
	};

	var url = URL.format(urlObject);
	log.trace(url);

	var handler = function(err, statusCode, data) {
		log.trace(statusCode);
		log.trace(data);

		var retData = null;

		if (err) {
			log.error('_getCoachPath> ' + err.name + ':' + err.message);
			callback(null);
			return;
		}

		if (statusCode == 200) {
			//整理数据
			retData = data;
		}

		callback(retData);
	};

	http.get(url, handler);	
}

/**
 * 获取城市到城市的汽车班次，包括行车时间
 * @param  {[type]}   stationA  [description]
 * @param  {[type]}   cityA     [description]
 * @param  {[type]}   stationB  [description]
 * @param  {[type]}   cityB     [description]
 * @param  {[type]}   startDate [description]
 * @param  {Function} callback  [description]
 */
function getCoachPath(stationA, cityA, stationB, cityB, startDate, callback) {

	async.parallel({
	    coachInfo: function(callback){
	    	_getCoachPath(stationA, cityA, stationB, cityB, startDate, function(data) {
	    		callback(null, data);
	    	});
	    },
	    time: function(callback){
	    	_getTime(cityA, cityB, function(time) {
	    		callback(null, time);
	    	});
	    }
	},
	function(err, results) {
	 	if (err) {
	 		log.error('getCoachPath> ' + err.name + ':' + err.message);
	 		callback(null);
	 		return;
	 	}

	 	log.trace(results);

	 	var time = results.time;
	 	var coachInfo = results.coachInfo;
	 	coachInfo.time = time;
	 	callback(coachInfo);
	});
} 

module.exports._getTime      = _getTime; //测过
module.exports._getCoachPath = _getCoachPath;  //未测试
module.exports.getCoachPath  = getCoachPath;  //未测试

//TODO 一些细节问题还没解决，单元测试还没有完成