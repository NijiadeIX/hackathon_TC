var startApp = require('./app/app.js');

if (process.argv.length >= 3) {
	startApp(parseInt(process.argv[2]));
} else {
	startApp();
}