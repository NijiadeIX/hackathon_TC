var URL = require('url');
var mongo = require('./mongo.js');
var async = require('async');
var http = require('./httpAgent.js');
var log = require('./log.js')('city.js');

var provinces = [
	'黑龙江省',
	'辽宁省',
	'吉林省',
	'内蒙古自治区',
	'河北省',
	'河南省',
	'山东省',
	'山西省',
	'浙江省',
	'江苏省',
	'湖北省',
	'湖南省',
	'安徽省',
	'江西省',
	'福建省',
	'广东省',
	'广西壮族自治区',
	'云南省',
	'贵州省',
	'四川省',
	'陕西省',
	'甘肃省',
	'新疆维吾尔自治区',
	'西藏自治区',
	'宁夏回族自治区',
	'青海省'
];

var baiduApi = {
	host : 'api.map.baidu.com',
	placeApiPathName : '/place/v2/search',
	ak : 'kD5pgcIZt0o5izHgB81mZ6uU'
};


function fetchCitysInProvince(provinceName, callback) {
	var urlObject = {
		protocol : 'http:',		
		host : baiduApi.host,
		pathname : baiduApi.placeApiPathName,
		query : {
			q : '城市',
			region : provinceName,
			page_size : 20,
			page_num : 0,
			output : 'json',
			ak : baiduApi.ak
		}
	};

	var url = URL.format(urlObject);

	var handler = function(err, statusCode, data) {
		if (err) {
			log.error('fetchCitysInProvince> ' + err.name + ':' + err.message);
			callback(null);
			return;
		}

		if (statusCode != 200) {
			callback(null);
			return;			
		}

		var retData = null;
		if (data && data.results) {
			retData = data.results;
		} 

		if(data.total > 20) {
			log.warn('data length bigger than 20');
		}

		callback(retData);
	};

	http.get(url, handler);
}

function fetchCityInfo(cityName, callback) {
	var urlObject = {
		protocol : 'http:',		
		host : baiduApi.host,
		pathname : baiduApi.placeApiPathName,
		query : {
			q : cityName,
			region : cityName,
			page_size : 10,
			page_num : 0,
			output : 'json',
			ak : baiduApi.ak
		}
	};

	var url = URL.format(urlObject);

	var handler = function(err, statusCode, data) {
		if (err) {
			log.error('fetchCityInfo> ' + err.name + ':' + err.message);
			callback(null);
			return;
		}

		if (statusCode != 200) {
			callback(null);
			return;			
		}

		var retData = null;
		if (data && data.results) {
			retData = data.results;
		} 

		callback(retData);
	};

	http.get(url, handler);
}

/**
 * 同步获取城市列表里面的城市的位置信息 
 * @param  {[type]}   citys    [description]
 * @param  {Function} callback [description]
 */
function parallelFetchCityInfo(citys, callback) {
	var taskList = [];
	var idx = 0;
	for (value in citys) {
		var task = function(callback_1) {
			var city = citys[idx];
			idx ++;
			fetchCityInfo(city, function(data) {
				var retData = {};
				if(data && data[0]) {
					var cityInfo = data[0];
					retData.name = city;
					retData.location = cityInfo.location;
				}

				callback_1(null, retData);
			});	
		};

		taskList.push(task);
	}

	var finalHanler = function(err, data) {
		if (err) {
			log.error('parallelFetchCityInfo> ' + err.name + ':' + err.message);
			callback(null);
			return;
		}

		callback(data);
	};

	async.parallel(taskList, finalHanler);
}

function parallelFetchCitys(provinces, callback) {
	//获取所有城市，
	var taskList = [];
	var idx = 0;
	for (value in provinces) {
		var task = function(callback_1) {
			var province = provinces[idx];
			idx ++;

			fetchCitysInProvince(province, function(data) {
				var retData = [];
				if (data) {
					data.forEach(function(cell) {
						if (cell.name) {
							retData.push(cell.name);
						}
					});
				}

				callback_1(null, retData);
			});
		};
		taskList.push(task);
	}

	var finalHanler = function(err, data) {
		if (err) {
			log.err('fetchAllCitysInfo> ' + err.name + ':' + err.message);
			return;
		}

		var citys = [];
		data.forEach(function(citysInProvince) {
			citysInProvince.forEach(function(city) {
				citys.push(city);
			});
		});

		callback(citys);
	};

	async.parallel(taskList, finalHanler);	
}

function saveToDb(citys, callback) {
	mongo.connect(function(err, db) {
		if (err) {
			log.error('fetchAllCitysInfo> ' + err.name  + ':' + err.message);
			return;
		}	

		var taskList = [];
		var idx = 0;
		for (value in citys) {
			var task = function(callback_1) {
				var city = citys[idx];
				idx ++;

				db.collection('citys').insertOne(city, function(err, result) {
					if (err) {
						log.error('fetchAllCitysInfo> ' + err.name  + ':' + err.message);
						return;
					}	

					callback_1(null, 1);
				});
			};

			taskList.push(task);
		}

		var finalHanler = function(err, results) {
			db.close();
			callback();
		};

		async.parallel(taskList, finalHanler);
	});
}

function fetchAllCitysInfo() {
	parallelFetchCitys(provinces, function(citys) {
		citys.push('北京市');
		citys.push('天津市');
		citys.push('上海市');
		citys.push('重庆市');

		parallelFetchCityInfo(citys, function(cityDetails) {
			log.trace(cityDetails);

			//saveToDb(cityDetails, function() {});
		});
	});
}

module.exports = fetchAllCitysInfo;