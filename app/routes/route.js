var express    = require('express');
var log        = require('../../util/log.js')('route.js');
var router     = express.Router();

router.get('/test', function(req, res) {
	res.status(200).send('hello!');
});
module.exports = router;