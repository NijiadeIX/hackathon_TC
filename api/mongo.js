var mongodb = require('mongodb').MongoClient;
var log = require('./log.js')('mongo.js');
var settings = require('../settings/db.json');

function connect(callback) {
	mongodb.connect(settings.url, callback);
}

module.exports.connect = connect;