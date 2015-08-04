var express    = require('express');
var log        = require('../../api/log.js')('route.js');
var QueryDAO        = require('../../api/query.js');

var router     = express.Router();

router.get('/test', function(req, res) {
	res.status(200).send('hello!');
});

router.get('/query', QueryDAO.queryTransport);

module.exports = router;