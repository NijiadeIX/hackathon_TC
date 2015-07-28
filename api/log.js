var log4js   = require('log4js');
var path     = require('path');
var settings = require('../settings/log.json');

function getLogger(category) {
	if (settings) {
		log4js.configure(settings);
	}

	if (category && typeof category == 'string') {
		return log4js.getLogger(category);
	} else {
		return log4js.getLogger('default');
	}
}

/**
 * 创建一个logger，logger标志为category
 * @param  {string} category logger的标志
 * @return {object}          logger
 */
function createLogger(category) {
	var logger = new Object;
	logger._inner = getLogger(category);

	logger.trace = function(message) {
		this._inner.trace(message);
	};
	logger.info  = function(message) {
		this._inner.info(message);
	};
	logger.warn  = function(message) {
		this._inner.warn(message);
	};
	logger.error = function(message) {
		this._inner.error(message);
	};
	logger.fatal = function(message) {
		this._inner.fatal(message);
	};

	return logger;
}

module.exports = createLogger;