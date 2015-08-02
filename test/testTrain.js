var train = require('../api/train.js');

function testParse() {
	var originData = {
		content : [
			[
				{
					data : {},
					type : 2
				},
				{
					data : {
						line : {
							name : "aaa",
						},
						on : {
							city_name : 'Acity',
							name : 'Astation',
							start_time : '000:00'
						},
						off : {
							city_name : 'Bcity',
							name : 'Bstation',
							start_time : '123:00'
						}
					},
					type : 1
				}
			],
			[
				{
					data : {
						line : {
							name : "BBB",
						},
						on : {
							city_name : 'X',
							name : 'Astation',
							start_time : '000:00'
						},
						off : {
							city_name : 'Y',
							name : 'Bstation',
							start_time : '123:00'
						}
					},
					type : 1
				}

			]
		]	
	};

	debugger;
	var ret = train._parseTrainData(originData);
	console.log(ret);
	console.log(ret.res[0].citys);
	console.log(ret.res[0].path);

	console.log(ret.res[1].citys);
	console.log(ret.res[1].path);
};

function getTrainPath() {
	debugger;
	train.getTrainPath('柳州市',null, '上海市',null, null, function(data) {
		data.res[0].path.forEach(function(cell) {
			console.log(cell);
		});
	});
}

getTrainPath();