angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {
  // Form data for the login modal
  $scope.loginData = {};

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

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
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

.controller('PlaylistCtrl', function($rootScope, $scope, $stateParams) {

})

.controller('authentication', function($rootScope, $scope, $stateParams, $http, s_im) {
	s_im.init();
	s_im.open({username : 'test3', password : '123456'});


	$scope.show = function() {
		console.log("show map");
		var map = new BMap.Map("allmap");            // 创建Map实例
		var point = new BMap.Point(116.404, 39.915); // 创建点坐标
		map.centerAndZoom(point,15);                 // 初始化地图,设置中心点坐标和地图级别。
		//map.addControl(new BMap.ZoomControl());      //添加地图缩放控件	
	}
	
})

.controller('routecontrol', function($rootScope, $scope, $stateParams, $http) {
	$scope.RouteData = {};
	$scope.RouteUserData = {};

	$scope.DoRouteAdd = function() {
		json = {
			"RouteName":$scope.RouteData['RouteName'],
			"RouteCode":$scope.RouteData['RouteCode'],
			"RoutePoint":$scope.RouteData['RoutePoint'],
		};

		console.log(json);

		var rest = "/route/add?data=" + encodeURIComponent(JSON.stringify(json));

		console.log(rest);
		$http.get(rest).success(function(data) {
			$scope.RouteData = {};
			$scope.GetAll();
		});
	};

	$scope.GetAll = function() {
		var rest = "/route/search";
		$scope.RouteList = [];
		$http.get(rest).success(function(data) {
			console.log(data);
			for (var i in data) {
				$scope.RouteList.push(data[i]);
			}
		});
	};

	$scope.GetAll();

	$scope.Del = function(_id) {
		json = {
			"_id":_id,
		};
		var rest = "/route/del?data=" + encodeURIComponent(JSON.stringify(json));
		$http.get(rest).success(function(data) {
			$scope.GetAll();
		});
	};


	/*route user function*/

	$scope.DoRouteUserAdd = function() {
		json = {
			"UserName":$scope.RouteUserData['UserName'],
			"RouteCode":$scope.RouteUserData['RouteCode'],
		};

		console.log(json);

		var rest = "/routeuser/add?data=" + encodeURIComponent(JSON.stringify(json));

		console.log(rest);
		$http.get(rest).success(function(data) {
			$scope.RouteUserData = {};
			$scope.GetRouteUserAll();
		});
	};


	$scope.GetRouteUserAll = function() {
		var rest = "/routeuser/search";
		$scope.RouteUserList = [];
		$http.get(rest).success(function(data) {
			console.log(data);
			for (var i in data) {
				$scope.RouteUserList.push(data[i]);
			}
		});
	};


	$scope.RouteUserDel = function(_id) {
		json = {
			"_id":_id,
		};
		var rest = "/routeuser/del?data=" + encodeURIComponent(JSON.stringify(json));
		$http.get(rest).success(function(data) {
			$scope.GetRouteUserAll();
		});
	};


	$scope.GetRouteUserAll();
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
			"type":'travel',
			"time":new Date(),
			"price":words[6],
			"start_time":words[4],
			"start_city":words[2],
			"end_city":words[0],
			"jumpurl":words[3],
			"url":words[3],
			"content":words[8],
			"offsale":words[5],
			"quota":words[7],
		};


		var rest = "/special_offer/add?json=" + encodeURIComponent(JSON.stringify(json));

		console.log(rest);
		$http.get(rest).
			success(function(data) {
		});		
	};
});
