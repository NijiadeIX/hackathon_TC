// 
// Here is how to define your module 
// has dependent on mobile-angular-ui
// 

window.onpopstate = function(event){
	if(event && event.state){
		document.title = event.state.title;
		document.body.innerHTML = event.state.html;
	}
}

var app = angular.module('MobileAngularUiExamples', [
		'ngRoute',
		'ngAnimate',
		'mobile-angular-ui',

		// touch/drag feature: this is from 'mobile-angular-ui.gestures.js'
		// it is at a very beginning stage, so please be careful if you like to use
		// in production. This is intended to provide a flexible, integrated and and 
		// easy to use alternative to other 3rd party libs like hammer.js, with the
		// final pourpose to integrate gestures into default ui interactions like 
		// opening sidebars, turning switches on/off ..
		'mobile-angular-ui.gestures',

		// If you're migrating from Mobile Angular UI 1.1 and you are using 
		// 'mobile-angular-ui.migrate.js' you have to require it too
		'mobile-angular-ui.migrate',

		'duScroll',

  		'phonecatServices'
		]);

// 
// You can configure ngRoute as always, but to take advantage of SharedState location
// feature (i.e. close sidebar on backbutton) you should setup 'reloadOnSearch: false' 
// in order to avoid unwanted routing.
// 
app.config(function($routeProvider) {
	$routeProvider.when('/',              {templateUrl: 'home.html', reloadOnSearch: false, controller: "MainController"});
	$routeProvider.when('/im/:id',        {templateUrl: 'im.html', reloadOnSearch: false, controller: "im"}); 
	$routeProvider.when('/scroll',        {templateUrl: 'scroll.html', reloadOnSearch: false, controller: "special_list"}); 
	$routeProvider.when('/tabs/:id',      {templateUrl: 'tabs.html', reloadOnSearch: false, controller: "special_detail"}); 
	$routeProvider.when('/forms',         {templateUrl: 'forms.html', reloadOnSearch: false, controller: "MainController"});
	$routeProvider.when('/drag',          {templateUrl: 'drag.html', reloadOnSearch: false});
});



//
// `$drag` example: drag to dismiss
//
app.directive('dragToDismiss', function($drag, $parse, $timeout){
	return {
		restrict: 'A',
	compile: function(elem, attrs) {
		var dismissFn = $parse(attrs.dragToDismiss);
		return function(scope, elem, attrs){
			var dismiss = false;

			$drag.bind(elem, {
				constraint: {
					minX: 0, 
				minY: 0, 
				maxY: 0 
				},
				move: function(c) {
					if( c.left >= c.width / 4) {
						dismiss = true;
						elem.addClass('dismiss');
					} else {
						dismiss = false;
						elem.removeClass('dismiss');
					}
				},
				cancel: function(){
					elem.removeClass('dismiss');
				},
				end: function(c, undo, reset) {
					if (dismiss) {
						elem.addClass('dismitted');
						$timeout(function() { 
							scope.$apply(function() {
								dismissFn(scope);  
							});
						}, 400);
					} else {
						reset();
					}
				}
			});
		};
	}
	};
});

//
// Another `$drag` usage example: this is how you could create 
// a touch enabled "deck of cards" carousel. See `carousel.html` for markup.
//
app.directive('carousel', function(){
	return {
		restrict: 'C',
	scope: {},
	controller: function($scope) {
		this.itemCount = 0;
		this.activeItem = null;

		this.addItem = function(){
			var newId = this.itemCount++;
			this.activeItem = this.itemCount == 1 ? newId : this.activeItem;
			return newId;
		};

		this.next = function(){
			this.activeItem = this.activeItem || 0;
			this.activeItem = this.activeItem == this.itemCount - 1 ? 0 : this.activeItem + 1;
		};

		this.prev = function(){
			this.activeItem = this.activeItem || 0;
			this.activeItem = this.activeItem === 0 ? this.itemCount - 1 : this.activeItem - 1;
		};
	}
	};
});

app.directive('carouselItem', function($drag) {
	return {
		restrict: 'C',
	require: '^carousel',
	scope: {},
	transclude: true,
	template: '<div class="item"><div ng-transclude></div></div>',
	link: function(scope, elem, attrs, carousel) {
		scope.carousel = carousel;
		var id = carousel.addItem();

		var zIndex = function(){
			var res = 0;
			if (id == carousel.activeItem){
				res = 2000;
			} else if (carousel.activeItem < id) {
				res = 2000 - (id - carousel.activeItem);
			} else {
				res = 2000 - (carousel.itemCount - 1 - carousel.activeItem + id);
			}
			return res;
		};

		scope.$watch(function(){
			return carousel.activeItem;
		}, function(n, o){
			elem[0].style['z-index']=zIndex();
		});


		$drag.bind(elem, {
			constraint: { minY: 0, maxY: 0 },
			adaptTransform: function(t, dx, dy, x, y, x0, y0) {
				var maxAngle = 15;
				var velocity = 0.02;
				var r = t.getRotation();
				var newRot = r + Math.round(dx * velocity);
				newRot = Math.min(newRot, maxAngle);
				newRot = Math.max(newRot, -maxAngle);
				t.rotate(-r);
				t.rotate(newRot);
			},
			move: function(c){
				if(c.left >= c.width / 4 || c.left <= -(c.width / 4)) {
					elem.addClass('dismiss');  
				} else {
					elem.removeClass('dismiss');  
				}          
			},
			cancel: function(){
				elem.removeClass('dismiss');
			},
			end: function(c, undo, reset) {
				elem.removeClass('dismiss');
				if(c.left >= c.width / 4) {
					scope.$apply(function() {
						carousel.next();
					});
				} else if (c.left <= -(c.width / 4)) {
					scope.$apply(function() {
						carousel.next();
					});
				}
				reset();
			}
		});
	}
	};
});


var special_off = function() {

};

special_off.prototype.init = function($rootScope, $scope, $routeParams, $http, Phone) {
	$scope.special_Name = '';
	$scope.special_Id = '';
	$scope.special_Type = 'travelling';
	$scope.special_Time = '';
	$scope.special_Price = '';
	$scope.special_StartTime = '';
	$scope.special_EndTime = '';
	$scope.special_StartCity = '';
	$scope.special_EndCity = '';
	$scope.special_Jumpurl = '';
	$scope.special_Content = '';


	$scope.SpeicalAddOffer = function() {
		
		$rootScope.loading = true;

		json = {
			"name":$scope.special_Name,
			"id":$scope.special_Id,
			"type":$scope.special_Type,
			"time":new Date(),
			"price":$scope.special_Price,
			"start_time":$scope.special_StartTime,
			"end_time":$scope.special_EndTime,
			"start_city":$scope.special_StartCity,
			"end_city":$scope.special_EndCity,
			"jumpurl":$scope.special_Jumpurl,
			"content":$scope.special_Content,
		};

		var rest = "/special_offer/add?json=" + encodeURIComponent(JSON.stringify(json));

		$http.get(rest).
			success(function(data) {
				$rootScope.loading = false;
			});

		$scope.special_Name = '';
		$scope.special_Id = '';
		$scope.special_Type = 'travelling';
		$scope.special_Time = '';
		$scope.special_Price = '';
		$scope.special_StartTime = '';
		$scope.special_EndTime = '';
		$scope.special_StartCity = '';
		$scope.special_EndCity = '';
		$scope.special_Jumpurl = '';
		$scope.special_Content = '';

		window.location.href = "#/forms/";
	};

	
};



//
// For this trivial demo we have just a unique MainController 
// for everything
//
app.controller('MainController', function($rootScope, $scope, $routeParams, $http, Phone){

	$scope.Name = 'hello';

	$scope.title = '携程内部特价';

	$rootScope.test = 'test1234';

	// User agent displayed in home page
	$scope.userAgent = navigator.userAgent;

	// Needed for the loading screen
	$rootScope.$on('$routeChangeStart', function(){
		$rootScope.loading = true;
	});

	$rootScope.$on('$routeChangeSuccess', function(){
		$rootScope.loading = false;
	});


	var special_off_m = new special_off();
	special_off_m.init($rootScope, $scope, $routeParams, $http, Phone);

	// Fake text i used here and there.
	$scope.lorem = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Vel explicabo, aliquid eaque soluta nihil eligendi adipisci error, illum corrupti nam fuga omnis quod quaerat mollitia expedita impedit dolores ipsam. Obcaecati.';

	// 
	// 'Scroll' screen
	// 
	/*
	var scrollItems = [];

	for (var i=1; i<=100; i++) {
		scrollItems.push('Item ' + i);
	}

	$scope.scrollItems = scrollItems;

	$scope.bottomReached = function() {
		alert('Congrats you scrolled to the end of the list!');
	}

	*/

	// 
	// Right Sidebar
	// 
	$scope.chatUsers = [
	{ name: 'Carlos  Flowers', online: true },
	{ name: 'Byron Taylor', online: true },
	{ name: 'Jana  Terry', online: true },
	{ name: 'Darryl  Stone', online: true },
	{ name: 'Fannie  Carlson', online: true },
	{ name: 'Holly Nguyen', online: true },
	{ name: 'Bill  Chavez', online: true },
	{ name: 'Veronica  Maxwell', online: true },
	{ name: 'Jessica Webster', online: true },
	{ name: 'Ebony Rice', online: false }
	];

	//
	// 'Forms' screen
	//  
	$scope.rememberMe = true;
	$scope.email = 'me@example.com';

	$scope.login = function() {
		alert('You submitted the login form');
	};


	var d = new Date();

	$scope.GisValue = 123456;


	var httpGet = function(position) {
		$scope.position = "Latitude: " + position.coords.latitude +
			  "Longitude: " + position.coords.longitude;
		console.log("Latitude: " + position.coords.latitude +
			  "Longitude: " + position.coords.longitude);

		var rest = "/gis/subway?location=" 
			+ position.coords.latitude
			+ ","
			+ position.coords.longitude 
			+ "&radius=8000";
		$http.get(rest).
			success(function(data) {
				$scope.greeting = data;
			});
	};

	$scope.GetGis = function($a) {
		//$scope.GisValue = $scope.GisValue + 1;
		console.log("GetGis");

		navigator.geolocation.getCurrentPosition(httpGet);
		
	};

	// 
	// 'Drag' screen
	// 
	$scope.notices = [];

	for (var j = 0; j < $scope.chatUsers.length; j++) {
		var user = $scope.chatUsers[j];
		$scope.notices.push({icon: 'envelope', message: 'Notice ' + j });
	}

	$scope.deleteNotice = function(notice) {
		var index = $scope.notices.indexOf(notice);
		if (index > -1) {
			$scope.notices.splice(index, 1);
		}
	};

	$scope.username = '';
	$scope.password = '';
	$rootScope.rooms = [

	];

	$scope.onOpen = function(r) {
		console.log("onOpen");
		//$scope.rooms = r.rooms;
		window.location.href = "#/gis/";
		for (var i in r.rooms) {
			console.log("rooms is " + r.rooms[i].name + "   " + r.rooms[i].roomId);
			$rootScope.rooms.push(r.rooms[i]);
		}
		Phone.groupsend({to:'141810209314877', msg:'12222222'});
	};

	$scope.handleTextMessage = function(message) {
		var from = message.from;//消息的发送者
		var mestype = message.type;//消息发送的类型是群组消息还是个人消息
		var messageContent = message.data;//文本消息体
		//TODO  根据消息体的to值去定位那个群组的聊天记录
		var room = message.to;
		console.log(mestype + "  " + messageContent);

		if (mestype == 'groupchat') {
			console.log(messageContent);
		} else {

		}
	};

	$scope.Login = function() {
		console.log($scope.username);
		console.log($scope.password);
		Phone.init({onOpen: $scope.onOpen, handleTextMessage: $scope.handleTextMessage});
		Phone.open({username:$scope.username, password:$scope.password});
	};

	

});

app.controller('im', ['$rootScope', '$scope', '$routeParams', 'Phone',
  function($rootScope, $scope, $routeParams, Phone) {

	  /*im */

	$scope.message = '';

	$scope.chats = ['111111111', '2222222'];

    $scope.id = $routeParams.id; 

    $scope.setImage = function(imageUrl) {
      $scope.phone = imageUrl;
    };

	$scope.Send = function() {
		console.log($scope.message);
		$scope.chats.push($scope.message);
		Phone.groupsend({to:$routeParams.id, msg:$scope.message});
		$scope.message = '';
		/*
		var index = $scope.chats.indexOf("hello");
		if (index > -1) {
			$scope.chats.splice(index, 1);
		}
		*/
	    //var	html = '<div class="section section-break"> <i class="fa fa-{{notice.icon}}"></i>' + $scope.message + '</div>';
		//angular.element('#helloim').append(html);
	};

	$scope.$on('$destroy', function iVeBeenDismissed() {
		// say goodbye to your controller here
		console.log("goodbye im ");
	});
	
  }]);



app.controller('special_list', ['$rootScope', '$scope', '$routeParams', '$http', '$document', '$sce', 'Phone', 'SpecialListService', 'SharedState',
  function($rootScope, $scope, $routeParams, $http, $document, $sce, Phone, SpecialListService, SharedState) {
	
	/*special list */

	$scope.special_offer_list = [];
	$scope.skip = 0;
	$scope.end = false;
	$scope.scroll_show = false;

	SpecialListService.httpget($http, $scope.end, $scope.special_offer_list, function() {

	});

	$scope.bottomReached = function() {
		console.log('Congrats you scrolled to the end of the list!');
		//httpget();
	};

	var detail_process = function(id, cb) {

		/*special list */
		json = {"limit":20,"skip":0};
		json['_id'] = id; 

		var rest = encodeURI("/special_offer/search?json=" + JSON.stringify(json));

		$http.get(rest).
			success(function(data) {
				$scope.special_offer_detail = data[0];
				$scope.special_offer_detail['showurl'] = $sce.trustAsResourceUrl($scope.special_offer_detail['showurl']);
				$scope.special_offer_detail['jumpurl'] = $sce.trustAsResourceUrl($scope.special_offer_detail['jumpurl']);
				console.log(data[0]);
				cb();
			});
	};

	$scope.ClickOn = function(url) {
		detail_process(url, function() {
			$scope.scroll_show = true;
			$rootScope.BackShow = true;
		});
	};

	$rootScope.BackOn = function() {
		console.log('backOn');
		$scope.scroll_show =  false;
		$rootScope.BackShow = false;

		SharedState.set( "activeTab", 1);

		//angular.element("a_first").trigger(jQuery.Event("click"));
	};

	$scope.$on('$destroy', function iVeBeenDismissed() {
		// say goodbye to your controller here
		console.log("goodbye special list");
		
		//SpecialListService.SetTop(document.getElementById("ScrollTop").scrollTop);

	});
	
  }]);



app.controller('special_detail', ['$rootScope', '$scope', '$routeParams', '$http', '$sce', 'Phone',
  function($rootScope, $scope, $routeParams, $http, $sce, Phone) {
	
	/*special list */
	json = {"limit":20,"skip":0};
	json['_id'] = $routeParams.id; 

	var rest = encodeURI("/special_offer/search?json=" + JSON.stringify(json));

	$http.get(rest).
		success(function(data) {
			$scope.special_offer_detail = data[0];
			$scope.special_offer_detail['showurl'] = $sce.trustAsResourceUrl($scope.special_offer_detail['showurl']);
			$scope.special_offer_detail['jumpurl'] = $sce.trustAsResourceUrl($scope.special_offer_detail['jumpurl']);
			console.log(data[0]);
		});

	$scope.$on('$destroy', function iVeBeenDismissed() {
		// say goodbye to your controller here
		console.log("goodbye special list");
	});
	
  }]);
