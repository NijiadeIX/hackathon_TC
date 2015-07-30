var URL = require('url');
var mongo = require('mongodb');
var async = require('async');
var http = require('./httpAgent.js');
var log = require('./log.js')('city.js');

var provinces = [
	'北京',
	'上海',
	'天津',
	'重庆',
	'黑龙江',
	'辽宁',
	'吉林',
	'内蒙古',
	'河北',
	'河南',
	'山东',
	'山西',
	'浙江',
	'江苏',
	'湖北',
	'湖南',
	'安徽',
	'江西',
	'福建',
	'广东',
	'广西',
	'云南',
	'贵州',
	'四川',
	'陕西',
	'甘肃',
	'新疆',
	'西藏',
	'宁夏',
	'青海'
];

var baiduApi = {
	host : 'api.map.baidu.com',
	placeApiPathName : '/place/v2/search',
	ak : 'kD5pgcIZt0o5izHgB81mZ6uU'
};


function fetchCitysInProvince(provinceName, callback) {

}

function fetchCityInfo(cityName, callback) {
	callback({'name':'aa','location':{'lnt':123, 'lat':123}});
}

function parallelFetchCityInfo(citys, callback) {
	var taskList = [];
	for (city in citys) {
		var task = function(callback) {

		};

		taskList.push(task);
	}

	var finalHanler = function(err, data) {
		if (err) {
			log.error('parallelFetchCityInfo> ' + err.name + ':' + err.message);
			callback(null);
			return;
		}

		log.trace(data);
		callback(data);
	};

	async.parallel(taskList, finalHanler);
}

function fetchAllCitysInfo() {
	//获取所有城市，
	var taskList = [];
	for (value in provinces) {
		var task = function(callback) {
			fetchCitysInProvince(value, function(data) {
				var retData = [];
				if (data.results) {
					data.results.forEach(function(cell) {
						if (cell.name) {
							var temp = {};
							temp.name = cell.name;
							retData.push(temp);
						}
					});
				}

				log.trace(retData);
				callback(null, retData);
			});
		};
		taskList.push(task);
	}

	//存数据库
	var finalHanler = function(err, data) {
		if (err) {
			log.err('fetchAllCitysInfo> ' + err.name + ':' + err.message);
			return;
		}

		data.foreEach(function(cell) {

		});
	};

	async.parallel(taskList, )
}