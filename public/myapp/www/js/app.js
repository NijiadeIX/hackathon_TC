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

  .state('app.search', {
    url: "/search",
    views: {
      'menuContent': {
        templateUrl: "templates/search.html",
        controller: 'control_myitem'
      }
    }
  })

  .state('app.im', {
    url: "/im",
    views: {
      'menuContent': {
        templateUrl: "templates/im.html",
        controller: 'control_im'
      }
    }
  })

  .state('app.chat', {
	url: "/im/:id",
    views: {
      'menuContent': {
        templateUrl: "templates/chat.html",
        controller: 'control_chat'
      }
    }
  })


  .state('app.map', {
    url: "/map",
    views: {
      'menuContent': {
        templateUrl: "templates/map.html",
        controller: 'map'
      }
    }
  })


  .state('app.map_list', {
    url: "/map_list",
    views: {
      'menuContent': {
        templateUrl: "templates/map_list.html",
        controller: 'map_list'
      }
    }
  })

  .state('app.map_detail', {
    url: "/map_detail/:id",
    views: {
      'menuContent': {
        templateUrl: "templates/map_detail.html",
        controller: 'map_detail'
      }
    }
  })

  .state('app.playlists', {
    url: "/playlists",
    views: {
      'menuContent': {
        templateUrl: "templates/playlists.html",
        //controller: 'PlaylistsCtrl'
        controller: 'special_list'
      }
    }
  })

  .state('app.single', {
    url: "/playlists/:id",
    views: {
      'menuContent': {
        templateUrl: "templates/playlist.html",
        controller: 'special_detail'
      }
    }
  })


  .state('app.groupitem', {
    url: "/groupitem/:id",
    views: {
      'menuContent': {
        templateUrl: "templates/groupitem.html",
        controller: 'groupitem'
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
  $urlRouterProvider.otherwise('/app/map');
});
