var log = require('./log.js')('train.js');
var http = require('./httpAgent.js');
var async = require('async');
var URL = require('url');

var priceApi = {
	host : 'op.juhe.cn',
	pathname : '/onebox/train/query_ab.php',
	key : 'f4613ed90b79c8e58ede62813cf14135'
};

var baiduApi = {
	host : 'map.baidu.com',
	pathname : '/'
}

/*
from:
	{
		"content":[
			[
				{
					"code":...
					"data":...
					"type":...
				},
				{
					//火车数据
					"data":{
						"line":{
							"name":...
						},
						"on":{
							"city_name":...
							"name":...
							"start_time":...		
						},
						"off":{
							"city_name":...
							"name":...
							"start_time":...
						}
					}
					"type":1
				}
			],
			[
				...
			]
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
function _parseTrainData(orginData) {
	var destData = {};

	//检查格式，格式不对返回null
	if (!orginData || !orginData.content || orginData.content.length == 0) {
		return null;
	}

	//遍历content
	var content = orginData.content;
	var paths = new trainCollection();
	content.forEach(function(cell) {
		var citys = [];
		var path = [];

		//往citys和path里面加数据
		cell.forEach(function(line) {
			//火车
			if (line.type == 1) {
				citys.push(line.data.on.city_name);
				citys.push(line.data.off.city_name);

				var element = {};
				element.name = line.data.line.name;
				element.type = 'train';
				element.from_station = line.data.on.name;
				element.to_station = line.data.off.name;
				element.depart_time = line.data.on.start_time;
				element.arrive_time = line.data.off.start_time.substring(0,6);

				path.push(element);
			}
		});

		//如果citys和path不为空
		if (citys.length > 0 && path.length > 0) {
			paths.insert(citys, path);
		}
	});

	var retData = {};
	retData.res = paths.toArray();
	return retData;
}

/*
return:
	[
		{
			from : '...',
			to : '...'
		},
		{
			from : '...',
			to : '...'
		}
	]
 */
function _buildPathList(trainPaths) {
	var list = [];
	var chosenList = {};
	trainPaths.res.forEach(function(detailPath) {
		var citys = detailPath.city;
		for (var i = 0; i < citys.length; i += 2) {
			var fromCity = citys[i];
			var toCity = citys[i + 1];

			if (!list[fromCity]) {
				chosenList[fromCity] = {};
			}

			if (!chosenList[fromCity][toCity]) {
				chosenList[fromCity][toCity] = true;
				list.push({from : fromCity, to : toCity});
			}
		}
	});

	return list;
}

function _getPrice(fromCity, toCtiy, callback) {
	var urlObject = {
		protocol : 'http:',
		host : priceApi.host,
		pathname : priceApi.pathname,
		query : {
			key : priceApi.key,
			from : fromCity,
			to : toCtiy
		}
	};

	var url = URL.format(urlObject);	

	var handler = function(err, statusCode, data) {
		if (err) {
			log.error('_getPrice> ' + err.name + ':' + err.message);
			callback(null);
			return;
		}

		var retData = null;

		if (statusCode == 200 && 
			data && data.result && 
			data.result.list && 
			data.result.list.length > 0) {

			retData = data.result.list;
		}

		callback(retData);
	};

	http.get(url, handler);
}

/*
return: 
	[
		{
			from:'...',
			to:'...',
			price_list:[]
		},
	]
 */
function _getAllPrice(priceList, callback) {
	var taskList = [];
	var idx = 0;
	for (value in priceList) {
		var task = function(callback) {
			var element = priceList[idx];
			idx ++;

			_getPrice(element.from, element.to, function(prices) {
				var data = {
					from : element.from,
					to : element.to
				};

				data.price_list = prices;
				callback(null, data);
			});
		};
		taskList.push(task);
	}

	var finalHandler = function(err, results) {
		var retData = [];

		retData = results;
		callback(retData);
	};

	async.parallel(taskList, finalHandler);
}

function _addPrice(trainPaths, priceList) {
	trainPaths.res.forEach(function(detailPath) {
		var citys = detailPath.city;
		for (var i = 0; i < citys.length; i += 2) {
			var fromCity = citys[i];
			var toCity = citys[i + 1];

			detailPath.path.forEach(function(lines) {
				var prices = _getPriceFromList(fromCity, toCity, lines[i/2].name, priceList);
				lines[i/2].price_list = prices;
			});
		}
	});

	return trainPaths;
}

function _getPriceFromList(fromCity, toCity, trainNo, priceList) {
	var retData = {};
	for (idx in priceList) {
		if (priceList[idx].from == fromCity && priceList[idx].to == toCity) {
			var elements = priceList[idx].price_list;
			for (i in elements) {
				if (elements[i].train_no == trainNo) {
					return elements[i].price_list;
				}
			};
		}
	};

	return retData;
}

function addPrice(trainPaths, callback) {
	var priceList = _buildPathList(trainPaths);
	_getAllPrice(priceList, function(prices) {
		callback(_addPrice(trainPaths, prices));
	});
}

function trainCollection() {
	var instance = new Object();
	instance._content = {};
	instance.insert = function(citys, lines) {
		var key = null;
		citys.forEach(function(cityName) {
			if (!key) {
				key = cityName;
			} else {
				key = key.concat("," + cityName);
			}
		});

		if (!this._content[key]) {
			this._content[key] = [];
		}

		this._content[key].push(lines);
	};

	instance.toArray = function() {
		var retData = [];
		for(key in this._content) {
			var citys = key.split(',');
			var element = {};
			element.city = citys;
			element.path = this._content[key];
			retData.push(element);
		}

		return retData;
	};

	return instance;
}


function _getTrainPath(cityA, stationA, cityB, stationB, startDate, callback) {
	var urlObject = {	
		protocol : 'http:',
		host : baiduApi.host,
		pathname : baiduApi.pathname,
		query : {
			newmap : 1,
			reqflag : 'pcmap',
			biz : 1,
			from : 'webmap',
			da_par : 'baidu',
			pcevaname : 'pc3',
			qt : 'bt',
			c : 1,
			sn : '2$$$$$$' + cityA + '$$0$$$$',
			en : '2$$$$$$' + cityB + '$$0$$$$',
			sc : 1,
			ec : 1,
			pn : 0,
			rn : 5			
		}
	};

	var url = URL.format(urlObject);

	var handler = function(err, statusCode, data) {
		if (err) {
			log.error('_getTrainPath> ' + err.name + ':' + err.message);
			callback(null);
			return;
		}

		var retData = null;

		if (statusCode == 200 && data) {
			retData = data;
		}

		callback(retData);
	};

	http.get(url, handler);
}

/**
 * 查询火车路线信息
 */
function getTrainPath(stationA, cityA, stationB, cityB,  startDate, callback) {
	_getTrainPath(cityA, null, cityB, null, null, function(data) {
		addPrice(_parseTrainData(data), callback);
	});
}


module.exports.getTrainPath = getTrainPath;

