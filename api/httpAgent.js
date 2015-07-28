var http = require('http');
var URL  = require('url');

/**
 * HTTP get method
 * @param  {string}   url      'http://www.example.com/index'
 * @param  {function} callback function(err, res) [optional]
 */
function get(url, callback) {
	http.get(url, function(res) {
		res.setEncoding('utf8');
		var resBody = '';
		res.on('data', function(chunk){
			resBody += chunk;
		});

		res.on('end', function() {
			var data;
			var lenOfBody = resBody.length;
			var contentType = res.headers['content-type'].toLowerCase();
			if (lenOfBody > 0 && contentType == 'application/json') {
				try {
					data = JSON.parse(resBody);
				} catch(err) {
					log.error(err.name + ':' + err.message);
					callback(err);
					return;
				}
			} else {
				data = resBody;
			}

			callback(null, res.statusCode, data);
		});
	}).on('error', function(err) {
		callback(err);
	});
}

/**
 * HTTP post method
 * @param  {string}   url         'http://www.example.com/index'
 * @param  {object}   body        [description]
 * @param  {Function} callback    function(err, res) [optional]
 */
function post(url, body, callback) {
	var _body = '';
	var _headers = {};
	var urlInfo = URL.parse(url);
	if (urlInfo.port) {
		urlInfo.port = parseInt(urlInfo.port);
	}

	if (typeof body == 'object') {
		_body = JSON.stringify(body);
	} else if (typeof body == 'string') {
		_body = body;
	}

	_headers['content-type'] = 'application/json';
	_headers['content-length'] = _body.length;

	var options = {
		hostname : urlInfo.hostname,
		port : urlInfo.port || 80,
		method : 'POST',
		path : urlInfo.path,
		headers : _headers
	}

	var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		var resBody = '';
		res.on('data', function(chunk) {
			resBody += chunk;
		});

		res.on('end', function() {
			var data;
			var lenOfBody = resBody.length;
			var contentType = res.headers['content-type'].toLowerCase();
			if (lenOfBody > 0 && contentType == 'application/json') {
				try {
					data = JSON.parse(resBody);
				} catch(err) {
					log.error(err.name + ':' + err.message);
					callback(err);
					return;
				}
			} else {
				data = resBody;
			}

			callback(null, res.statusCode, data);
		});
	}).on('error', function(err) {
		callback(err);
	});

	req.write(_body);
	req.end();
}

module.exports.get = get;
module.exports.post = post;