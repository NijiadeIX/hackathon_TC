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

/*
from:
	{
		"time":"...", 
		"data":[
			{
				"bus_number":"...",
				"bus_type":"...",
				"from_city_name":"...",
				"from_station_name":"...",
				"to_city_name":"...",
				"to_station_name":"...",
				"start_time":"...",
				"price":123
			}
		]
	}

to:
	{
		"res":[
			{
				"city":[A, B],
				"path":[
					[
						{
							"name":"1234-1", "from_station":"A1", "to_station":"B1", "depart_time":"008:00", "arrive_time":"009:00", "price":"60"},
						}
					],
					[
						{}
					]
				]
			}
		]
	}


 */
function _parseCoachData(originData) {
	log.trace("origin data");
	log.trace(originData);

	var destData = {};
	//数据格式不对，直接返回null
	if (!originData || !originData.time || !originData.data || originData.data.length == 0) {
		return null;
	}

	destData.res = [];

	var pathInfo = {};
	pathInfo.city = [];
	pathInfo.path = [];

	var fromCity, toCity, time;
	time     = originData.time;	
	fromCity = originData.data[0].from_city_name;
	toCity   = originData.data[0].to_city_name;
	pathInfo.city.push(fromCity);
	pathInfo.city.push(toCity);

	for(aPath in originData.data) {
		var element = {};
		element.name = aPath.bus_number;
		element.from_station = aPath.from_station_name;
		element.to_station = aPath.to_station_name;
		element.price = aPath.price;

		var timeObject = _parseTime(aPath.start_time, time);
		element.depart_time = timeObject.departTime;
		element.arrive_time = timeObject.arriveTime;

		pathinfo.path.push(element);
	}

	destData.res.push(pathInfo);

	log.trace('dest data');
	log.trace(destData);
	return destData;
}

function _parseTime(beginTime, duration) {
	debugger;
	//TODO
	return {"departTime":"010:11", "arriveTime":"011:11"};
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

		if (statusCode == 200 && data) {
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
	var getCoachInfoTask = function(callback_1) {
		//获取没有耗时的线路信息
		_getCoachPath(stationA, cityA, stationB, cityB, startDate, function(data) {
			callback_1(null, data);
		});
	};

	var getTimeTask = function(callback_1){
		//获取从这个城市A到城市B话费的时间
    	_getTime(cityA, cityB, function(time) {
    		callback_1(null, time);
    	});
    };

    var parallelTasks = {
    	coachInfo : getCoachInfoTask,
    	time : getTimeTask
    };

    var finalHandler = function(err, results) {
 	 	if (err) {
	 		log.error('getCoachPath> ' + err.name + ':' + err.message);
	 		callback(null);
	 		return;
	 	}

	 	log.trace(results);

	 	//给线路信息加上耗时
	 	var time = results.time;
	 	var coachInfo = results.coachInfo;
	 	coachInfo.time = time;

	 	//解析成翔B需要的格式
	 	var retData = _parseCoachData(coachInfo);
	 	callback(retData);   	
	};

    //并行执行任务
	async.parallel(parallelTasks, finalHandler);
} 

module.exports._getTime      = _getTime; //测过
module.exports._getCoachPath = _getCoachPath;  //未测试
module.exports.getCoachPath  = getCoachPath;  //未测试

//TODO 一些细节问题还没解决，单元测试还没有完成