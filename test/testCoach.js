var coach = require('../api/coach.js');

function getCoach() {
	coach.getCoachPath(null, '柳州市', null, '宜州市', '2015-08-02', function(data) {
		debugger;
		console.log(data);
	});
}

getCoach();