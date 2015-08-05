var express    = require('express');
var bodyParser = require('body-parser');
var settings   = require('../settings/app.json');
var log        = require('../api/log.js')('app.js');
var router     = require('./routes/route.js');
var jsonParser = bodyParser.json();
var app        = express();
var path 		= require('path');

/**
 * used to start the server, optional parameter is port
 * @param  {number} port server will run on the port
 */


function run(port) {
	configure();

	if (port && typeof port == 'number') {
		log.info('server run on 0.0.0.0:' +  port);
		app.listen(port);
	} else {
		if (!settings || !settings.port || typeof settings.port != 'number') {
			log.error('Please set the server port');
			log.info('Server shutdown');
			return;
		}

		log.info('server run on 0.0.0.0:' + settings.port);
		app.listen(settings.port);
	}
}

function configure() {
	console.log(__dirname);
	var publicPath = path.resolve(__dirname, '../public');
	app.use(express.static(publicPath));
	app.use(jsonParser);
	app.use(errHandler);
	app.use(router);
	process.on('uncaughtException', function(err) {
		log.error('uncaughtException');
	});
}
 
function errHandler(err, req, res, next) {
	if (err) {
		log.error(err.name + ':' + err.message);

		var statusCode = err.status || 500;
		var resBody    = (statusCode == 500? { message : "server error"} : { message : "something bad in your request" });
		res.status(statudCode).json(resBody);
	}
} 

module.exports = run;