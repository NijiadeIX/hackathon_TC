var mongo = require('../api/mongo.js');

mongo.connect(function(err, db) {
	if (err) {
		console.log(err.name + ':'+err.message);
		return;
	}

	db.collection('test').insertOne({"testdata":123124}, function(err, result) {
		if (err) {
			console.log(err.name + ':'+err.message);
			return;
		}

		console.log(result);
		db.close();
	});
});

module.exports = function() {};