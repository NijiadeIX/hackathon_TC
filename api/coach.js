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

	var handler = function(err, statusCode, data) {
		var time = 0;

		if (err) {
			log.error('_getTime> ' + err.name + ':' + err.message);
			callback(time);
			return;
		}

		if (statusCode == 200 && 
			data &&
			data.result && 
			data.result.elements && 
			data.result.elements.length > 0 &&
			data.result.elements[0].duration && 
			data.result.elements[0].duration.value
			) {

			time = data.result.elements[0].duration.value;
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
function _parseCoachData(originData, fromCity, toCity) {
	var destData = {};
	//数据格式不对，直接返回null
	if (!originData || !originData.time || !originData.data || originData.data.length == 0) {
		return null;
	}

	destData.res = [];

	var pathInfo = {};
	pathInfo.city = [];
	pathInfo.path = [];

	var time;
	time = originData.time;	

	pathInfo.city.push(fromCity);
	pathInfo.city.push(toCity);

	var dataList = originData.data;
	for(idx in dataList) {
		var elements = [];
		var element = {};
		element.type = 'coach';
		element.name = dataList[idx].bus_number;
		element.from_station = dataList[idx].from_station_name;
		element.to_station = dataList[idx].to_station_name;
		element.price_list = [];
		element.price_list.push({price_type : 'coach', price : dataList[idx].full_price << 0});;

		var timeObject = _parseTime(dataList[idx].from_time, time);
		element.depart_time = timeObject.departTime;
		element.arrive_time = timeObject.arriveTime;

		elements.push(element);
		pathInfo.path.push(elements);
	}

	destData.res.push(pathInfo);

	return destData;
}

// fromTime '01:11' duration '55'
// '002:16'
function _parseTime(beginTime, duration) {
	var retData = {};
	var hourInt, minuteInt, durationInt;
	var departTime, arriveTime;
	var dayCount = 0;
	var cells = beginTime.split(':');

	departTime = '0' + beginTime;

	hourInt = parseInt(cells[0]);
	minuteInt = parseInt(cells[1]);
	durationInt = parseInt(duration);

	minuteInt += durationInt / 60 << 0;
	hourInt += (minuteInt / 60) << 0;
	dayCount += (hourInt / 24) << 0;

	hourInt %= 24;
	minuteInt %= 60;

	arriveTime = dayCount.toString();

	if (hourInt < 10) 
		arriveTime = arriveTime + '0' + hourInt;
	else
		arriveTime = arriveTime + hourInt;

	arriveTime += ':';

	if (minuteInt < 10) 
		arriveTime = arriveTime + '0' + minuteInt;
	else
		arriveTime = arriveTime + minuteInt;

	return {"departTime" : departTime, "arriveTime" : arriveTime};
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
		query : {
			param : '/bus/busList',
			from : cityA,
			to : cityB,
			date : startDate
		}
	};

	var url = URL.format(urlObject);

	var handler = function(err, statusCode, data) {
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
	var prettyCityA, prettyCityB;
	//prettyCityA = cityA.substring(0, cityA.length - 1);
	//prettyCityB = cityB.substring(0, cityB.length - 1);
	prettyCityA = cityA.replace(/市|县/, '');
	prettyCityB = cityB.replace(/市|县/, '');
	debugger;
	var getCoachInfoTask = function(callback_1) {
		//获取没有耗时的线路信息
		_getCoachPath(stationA, prettyCityA, stationB, prettyCityB, startDate, function(data) {
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

	 	//给线路信息加上耗时
	 	var time = results.time;
	 	var coachInfo = results.coachInfo;
	 	if (coachInfo)
	 		coachInfo.time = time;	

	 	//解析成翔B需要的格式
	 	var retData = _parseCoachData(coachInfo, cityA, cityB);
	 	debugger;
	 	callback(retData);   	
	};

    //并行执行任务
	async.parallel(parallelTasks, finalHandler);
} 

module.exports.getCoachPath  = getCoachPath; 

