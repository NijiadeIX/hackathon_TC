// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider

   .state('app', {
		url: "/app",
		abstract: true,
		templateUrl: "templates/menu.html",
		controller: 'AppCtrl'
	})

  .state('app.authentication', {
    url: "/authentication",
    views: {
      'menuContent': {
        templateUrl: "templates/authencation.html",
        controller: 'authentication'
      },
      'myadd': {
        templateUrl: "templates/chat.html",
      }
    }
  })



  .state('app.route', {
    url: "/route",
    views: {
      'menuContent': {
        templateUrl: "templates/route.html",
        controller: 'routecontrol'
      }
    }
  })

  .state('app.special_add', {
    url: "/special_add",
    views: {
      'menuContent': {
        templateUrl: "templates/special_add.html",
        controller: 'special_add'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  
	$urlRouterProvider.otherwise('/app/authentication');
});
