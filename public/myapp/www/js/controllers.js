angular.module('starter.controllers', [])

.controller('AppCtrl', function($rootScope, $scope, $ionicModal, $timeout, $http, s_im) {
  // Form data for the login modal
  $rootScope.loginData = {};
  $rootScope.loginData.username = "test";
  $rootScope.loginData.password = "123456";

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  var search = function(type, callback) {

		json = {"type":type, "limit":20,"skip":0};

	
		var rest = encodeURI("/special_offer/search?json=" + JSON.stringify(json));

		$http.get(rest).success(function(data) {
			callback(data);
		});
  }

  $rootScope.GetPeople = function(username) {
	  for (x in $rootScope.UserList) {
			if ($rootScope.UserList[x].name == username) {
				return $rootScope.UserList[x].img;
			}
	  }

  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $rootScope.loginData);
	s_im.init();
	s_im.open({username : $rootScope.loginData.username, password : $rootScope.loginData.password});


	search('register', function(data) {
		console.log(data);
		$rootScope.UserList = data;
		$rootScope.loginData.img = $rootScope.GetPeople($rootScope.loginData.username);
	});


    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})


.controller('map', function($rootScope, $scope, $stateParams, $http, $sce) {

	$rootScope.map = {};

	$rootScope.map.date_time = new Date();

	$scope.map_list_get = function() {
		if ($rootScope.map.start_city != null 
			&& $rootScope.map.end_city != null) {
			window.location.href = "#/app/map_list";
		}
	}
})

.controller('map_list', function($rootScope, $scope, $stateParams, $http, $sce, MapService) {

	if ($rootScope.map == null) {
		window.location.href = "#/app/map";
		return;
	} else {
		//console.log($rootScope.map.date_time);

		var map_get_callback = function() {
			$scope.map_list = MapService.GetCitys();
		};

		//var map_date = new Date($rootScope.map.date_time);
		var map_date = $rootScope.map.date_time;
		var map_date_tmp = map_date.getFullYear() 
	+ "-" + (map_date.getMonth() + 1 < 10 ? "0" + (map_date.getMonth() + 1) : map_date.getMonth())
	+ "-" + map_date.getDate();

		console.log(map_date_tmp);

		$scope.map_list = MapService.httpget($http, $sce, $rootScope.map.start_city, $rootScope.map.end_city, map_date_tmp, map_get_callback);
	}

})

.controller('map_detail', function($rootScope, $scope, $stateParams, $http, $sce, MapService) {
	
	$scope.map_detail_list = MapService.GetMapDetail($stateParams.id);
	$scope.citys = MapService.GetCityOne($stateParams.id);
	console.log("detail map list");
	console.log($scope.map_detail_list);
})

.controller('control_myitem', function($rootScope, $scope, $stateParams, $http, $sce, SpecialListService, s_im, s_item) {

})

.controller('PlaylistCtrl', function($scope, $stateParams) {

})

.controller('control_im', function($rootScope, $scope, $stateParams, $http, $sce, SpecialListService, s_im) {

	$scope.group_chat_list = [];
	$scope.my_chat_list = [];
	$scope.local_service_list = [];
	$scope.local_people_list = [];

	$scope.button_name = 'ShowMore';

	var search = function(type, callback) {

		json = {"type":type, "limit":20,"skip":0};

	
		var rest = encodeURI("/special_offer/search?json=" + JSON.stringify(json));
		$scope.a = 1;

		$http.get(rest).success(function(data) {
			callback(data);
		});
	}

	search('group_chat', function(data) {
		console.log(data);
		$scope.group_chat_list = data;
	});

	//search('local_service_chat', function(data) {
	search('guide', function(data) {
		console.log(data);
		$scope.local_service_list = data;
	});


	search('agent', function(data) {
		console.log(data);
		$scope.local_people_list = data;
	});

	search('my_chat', function(data) {
		console.log(data);
		$scope.my_chat_list = data;
	});
	
})

.controller('control_chat', function($rootScope, $scope, $stateParams, $http, $sce, SpecialListService, s_im) {
	
	$scope.ChatData = {};
	$scope.chat_message_list = [];

	json = {"limit":20,"skip":0};
	json['_id'] = $stateParams.id; 

	var rest = encodeURI("/special_offer/search?json=" + JSON.stringify(json));

	$http.get(rest).success(function(data) {
			$scope.special_offer_detail = data[0];
			console.log(data[0]);

			if ($rootScope.tuichatmessage != null) {
				if ($rootScope.tuichatmessage != '') {
					var data = {
						from: 'me',
						message : $rootScope.tuichatmessage,
						pic : $rootScope.loginData.img,
					};
					$scope.chat_message_list.push(data);
					$rootScope.tuichatmessage = '';
				}
			}

			$scope.Send = function() {
				s_im.SendText('1426899873812949', $scope.ChatData.data, "groupchat");
				console.log($rootScope.loginData.img);
				var data = {
					from: 'me',
					message : $scope.ChatData.data,
					pic : $rootScope.loginData.img,
				};
				$scope.chat_message_list.push(data);
				$scope.ChatData = {};
			};

			$scope.$on('myEvent', function(e, value) {
				$scope.$apply(function (){
					if (value.from != $rootScope.loginData.username) {
						var pic = $rootScope.GetPeople(value.from);
						var data = {
							from: value.from,
							message : value.data,
							pic : pic,
						};
						$scope.chat_message_list.push(data);
					}
					
				});
				
			});
	});
})

.controller('special_list', 
  function($rootScope, $scope, $http, $sce, SpecialListService, s_im, s_item) {

	$scope.special_offer_list = [];
	$scope.special_hotel_list = [];
	$scope.special_eat_list = [];
	$scope.special_guide_list = [];
	$scope.special_agent_list = [];
	$scope.special_group_list = [];
	$scope.skip = 0;
	$scope.end = false;
	$scope.scroll_show = false;
	$scope.button_name = 'ShowMore';

	SpecialListService.httpget($http, $scope.end, $scope.special_offer_list, function() {

	});

	$scope.showmore = function() {
		console.log('show more button');
		if ($scope.end == false) {
			SpecialListService.httpget($http, $scope.end, $scope.special_offer_list, function() {

			});
		} else {

		}
	};


	var search = function(type, callback) {

		json = {"type":type, "limit":20,"skip":0};

	
		var rest = encodeURI("/special_offer/search?json=" + JSON.stringify(json));
		$scope.a = 1;

		$http.get(rest).success(function(data) {
			callback(data);
		});
	}

	search('hotel', function(data) {
		console.log(data);
		$scope.special_hotel_list = data;
	});

	search('eat', function(data) {

		$scope.special_eat_list = data;
	});

	search('guide', function(data) {

		$scope.special_guide_list = data;
	});

	search('agent', function(data) {

		$scope.special_agent_list = data;
	});


	search('group', function(data) {
		$scope.special_group_list = data;
	});


	$scope.click_shop = function() {
		$scope.data = {};
		$scope.data.name = 'myitem';
		$scope.data.mytime = new Date();

		s_item.get(function(data) {
			$scope.data.my_item = data;
			//$scope.data.totle_price;
			console.log('get s_item');
			for (i in data) {
				$scope.data.totle_price += parseInt(data[i].price);
				console.log(data[i].price);
			}

			$scope.publish = function() {
				if ($scope.data.my_item.length > 0) {

					json = {
						"name":$scope.data.name,
						"type":'group',
						"time":new Date(),
						"price":$scope.data.totle_price,
						"items":$scope.data.my_item,
						"pic":$rootScope.loginData.img,
					};

					s_item.clear();

					console.log(json);
					var rest = "/special_offer/add?json=" + encodeURIComponent(angular.toJson(json));

					$http.get(rest).success(function(data) {
						$scope.data.my_item = {};
						search('group', function(data) {
							$scope.special_group_list = data;
						});
					});
				}

			};
		});
	};
})






.controller('special_detail', function($rootScope, $scope, $stateParams, $http, $sce, SpecialListService, s_item) {

	$rootScope.root_button_show = 'true';
	

	$scope.$on('$destroy', function iVeBeenDismissed() {
		console.log("goodbye im ");
		$rootScope.root_button_show = 'false';
		$rootScope.root_click = null;
	});
	
	/*special list */
	/*
	json['_id'] = $stateParams.id; 
	
	json = {"limit":20,"skip":0};

	var rest = encodeURI("/special_offer/search?json=" + JSON.stringify(json));
	$scope.a = 1;

	$http.get(rest).
		success(function(data) {
			$scope.special_offer_detail = data[0];
			$scope.special_offer_detail['showurl'] = $sce.trustAsResourceUrl($scope.special_offer_detail['showurl']);
			$scope.special_offer_detail['jumpurl'] = $sce.trustAsResourceUrl($scope.special_offer_detail['jumpurl']);
				

			console.log(data[0]);
		});
	*/

	SpecialListService.GetOne($http, $stateParams.id, function(x) {
		$scope.special_offer_detail = x;
		$scope.special_offer_detail['showurl'] = $sce.trustAsResourceUrl($scope.special_offer_detail['showurl']);
		$scope.special_offer_detail['jumpurl'] = $sce.trustAsResourceUrl($scope.special_offer_detail['jumpurl']);

		$rootScope.root_click = function() {
			s_item.add(x);
		};
	});

})


.controller('groupitem', function($rootScope, $scope, $stateParams, $http, $sce, SpecialListService, s_im, s_item) {

	json = {"_id":$stateParams.id,"limit":20,"skip":0};

	console.log($stateParams.id);

	var rest = encodeURI("/special_offer/search?json=" + JSON.stringify(json));
	$scope.a = 1;

	$http.get(rest).success(function(data) {
			console.log(data);
			$scope.data = data[0];
				
		});
	$scope.tui = function() {
		$rootScope.tuichatmessage = "我参加了xx活动" + "http://121.40.198.251/myapp/www#/app/im/" + $stateParams.id;
		window.location.href = "#/app/im/550c1e7dfeef6145b9f12276";

	}
})

.controller('special_add', 
  function($rootScope, $scope, $http, $sce) {
	$scope.detail = {};
	$scope.submit = function() {
	
		var words = $scope.detail.data.split('\t')		
		var id = words[3].split('/')
		var f_id = id[id.length - 1].split('.')

		json = {
			"name":words[1],
			"id":f_id[0],
			"type":"group_chat",
			"time":new Date(),
			"price":words[6],
			"start_time":words[4],
			"start_city":words[2],
			"end_city":words[0],
			"jumpurl":$scope.detail.url,
			"url":words[3],
			"content":words[8],
			"offsale":words[5],
			"quota":words[7],
			"crawl": {
				pricture:[$scope.detail.pricture,]
			}
		};


		var rest = "/special_offer/add?json=" + encodeURIComponent(JSON.stringify(json));

		console.log(rest);
		$http.get(rest).
			success(function(data) {
				//$scope.detail.data = '';
				$scope.detail.url = '';
				$scope.detail.pricture = '';


		});		
	};
});
