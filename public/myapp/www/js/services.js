angular.module('starter.services', [])

.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [{
    id: 0,
    name: 'Ben Sparrow',
    lastText: 'You on your way?',
    face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    lastText: 'Hey, it\'s me',
    face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
  }, {
    id: 2,
    name: 'Andrew Jostlin',
    lastText: 'Did you get the ice cream?',
    face: 'https://pbs.twimg.com/profile_images/491274378181488640/Tti0fFVJ.jpeg'
  }, {
    id: 3,
    name: 'Adam Bradleyson',
    lastText: 'I should buy a boat',
    face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
  }, {
    id: 4,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'https://pbs.twimg.com/profile_images/491995398135767040/ie2Z_V6e.jpeg'
  }, {
    id: 5,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'https://pbs.twimg.com/profile_images/491995398135767040/ie2Z_V6e.jpeg'
  }, {
    id: 6,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'https://pbs.twimg.com/profile_images/491995398135767040/ie2Z_V6e.jpeg'
  }, {
    id: 7,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'https://pbs.twimg.com/profile_images/491995398135767040/ie2Z_V6e.jpeg'
  },{
    id: 8,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'https://pbs.twimg.com/profile_images/491995398135767040/ie2Z_V6e.jpeg'
  }];

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  }
})

/**
 * A simple example service that returns some data.
 */
.factory('Friends', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var friends = [{
    id: 0,
    name: 'Ben Sparrow',
    notes: 'Enjoys drawing things',
    face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    notes: 'Odd obsession with everything',
    face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
  }, {
    id: 2,
    name: 'Andrew Jostlen',
    notes: 'Wears a sweet leather Jacket. I\'m a bit jealous',
    face: 'https://pbs.twimg.com/profile_images/491274378181488640/Tti0fFVJ.jpeg'
  }, {
    id: 3,
    name: 'Adam Bradleyson',
    notes: 'I think he needs to buy a boat',
    face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
  }, {
    id: 4,
    name: 'Perry Governor',
    notes: 'Just the nicest guy',
    face: 'https://pbs.twimg.com/profile_images/491995398135767040/ie2Z_V6e.jpeg'
  }];


  return {
    all: function() {
      return friends;
    },
    get: function(friendId) {
      // Simple index lookup
      return friends[friendId];
    }
  }
})

.factory('s_item', function() {
	var vtrip_item = {
		my_item : [],

		add : function(item) {
			var _this = this;
			_this.my_item.push(item);
		},
		
		get: function(cb) {
			var _this = this;
			cb(_this.my_item);
		},

		clear : function() {
			var _this = this;
			_this.my_item = [];
		}
	};
	return vtrip_item;

})

.factory('s_im', ['$rootScope', function($rootScope) {
	var vtrip_im = {
		init: function() {
			var _this = this;
			_this.conn  = new Easemob.im.Connection();
			_this.conn.init({
				//当连接成功时的回调方法
				onOpened : function() {
					console.log("befare onOpen1");
					_this.handleOpen(_this.conn);
				},
				onClosed : function() {
					//handleClosed();
				},
				//收到文本消息时的回调方法
				onTextMessage : function(message) {
					console.log('recv message');
					_this.handleTextMessage(message);
				},
				//收到表情消息时的回调方法
				onEmotionMessage : function(message) {
					//handleEmotion(message);
				},
				//收到图片消息时的回调方法
				onPictureMessage : function(message) {
					//handlePictureMessage(message);
				},
				//收到音频消息的回调方法
				onAudioMessage : function(message) {
					//handleAudioMessage(message);
				},
				onLocationMessage : function(message) {
					//handleLocationMessage(message);
				},
				//收到联系人订阅请求的回调方法
				onPresence : function(message) {
					//handlePresence(message);
				},
				//收到联系人信息的回调方法
				onRoster : function(message) {
					//handleRoster(message);
				},
				//异常时的回调方法
				onError : function(message) {
					//handleError(message);
				}
			});
		},

		open : function(c) {
			var _this = this;
			_this.conn.open({
				user : c.username,
				pwd :  c.password,
				appKey : 'helloorange#vtrip'
			});
		},

		SendText : function(to, msg, type) {
			var _this = this;
			var options = {
				to : to,
				msg : msg,
				type : type 
			};

			//easemobwebim-sdk发送文本消息的方法 to为发送给谁，meg为文本消息对象
			_this.conn.sendTextMessage(options);
		},

		handleOpen : function(conn) {
			var _this = this;

			conn.setPresence();
			conn.listRooms({
				success : function(rooms) {
					if (rooms) {
						for (var i in rooms) {
							console.log("rooms is " + rooms[i].name + "   " + rooms[i].roomId);
						}
						//c.onOpen({roster: roster, rooms: rooms});
					}
				},
				error : function(e) {

				}
			});
		},

		handleTextMessage: function(message) {
			var from = message.from;//消息的发送者
			var mestype = message.type;//消息发送的类型是群组消息还是个人消息
			var messageContent = message.data;//文本消息体
			//TODO  根据消息体的to值去定位那个群组的聊天记录
			var room = message.to;
			console.log(messageContent);
			$rootScope.$broadcast("myEvent", message);
		},
	};
	return vtrip_im;
}])


.factory('MapService', function() {

	var MapList = {
		
		MapResult : {
		   
			"res": [
			   {//pathSet
			       "city":['A','B','B', 'C'],
			       "path":
			       [//paths
				   {//path
				       "total_time":"60",
				       "total_cost":"200",
				       "element":
					       [
						   {"type":"coach", "name":"c1234", "from_station":"A1", "to_station":"B1", "from_city":"A", "to_city":"B", "depart_time":"008:00", "arrive_time":"009:00", "price_list":[{"type":"客车", "price":"60"}]},
						   {"type":"train", "name":"D5240", "from_station":"A1", "to_station":"B1", "from_city":"A", "to_city":"B", "depart_time":"009:00", "arrive_time":"010:00", "price_list":[{"type":"二等座", "price":"150"},{"type":"一等座", "price":"200"},{"type":"商务座", "price":"300"}]}
					       ]
				   },
				   {
				       "total_time":"50",
				       "total_cost":"200",
				       "element":
					       [
						   {"type":"coach", "name":"c1234", "from_station":"A1", "to_station":"B1", "from_city":"A", "to_city":"B", "depart_time":"008:00", "arrive_time":"009:00", "price":"60"},
						   {"type":"train", "name":"D5240", "from_station":"A1", "to_station":"B1", "from_city":"A", "to_city":"B", "depart_time":"009:00", "arrive_time":"010:00", "price":"60"}
					       ]
				   }
			       ]
			   },
			   {  

			       "city":['A','F', 'F', 'C'],
			       "path":
			       [
				   {
				       "total_time":"60",
				       "total_cost":"200",
				       "element":
					       [
						   {"type":"coach", "name":"c1234", "from_station":"A1", "to_station":"B1", "from_city":"A", "to_city":"B", "depart_time":"008:00", "arrive_time":"009:00", "price":"60"},
						   {"type":"train", "name":"D5240", "from_station":"A1", "to_station":"B1", "from_city":"A", "to_city":"B", "depart_time":"009:00", "arrive_time":"010:00", "price":"60"}
					       ]
				    },
				    {
				       "total_time":"60",
				       "total_cost":"200",
				       "element":
					       [
						   {"type":"coach", "name":"c1234", "from_station":"A1", "to_station":"B1", "from_city":"A", "to_city":"B", "depart_time":"008:00", "arrive_time":"009:00", "price":"60"},
						   {"type":"train", "name":"D5240", "from_station":"A1", "to_station":"B1", "from_city":"A", "to_city":"B", "depart_time":"009:00", "arrive_time":"010:00", "price":"60"}
					       ]
				    }
			       ]
			   }
			   ]	 

		},


		GetCity : function(res) {
			var _this = this;
			var CityList = [];
			for (x in res) {

				/*
				var CityListString = "";

				for (y in res[x]['city']) {
					CityListString += res[x]['city'][y];

					if (parseInt(y) != res[x]['city'].length - 1) {
						console.log(y + "    " + res[x]['city'].length);
						if ((y % 2) == 0) {
							CityListString += "-->";
						} else {
							CityListString += "  ";
						}
					}
				}
				*/

				CityList.push({
					"id" : x,
					"name":res[x]['city']
				});
			}

			return CityList;
		},

		GetCityOne : function(id) {
			var _this = this;
			return _this.MapResult["res"][id]["city"].toString();
		},

		GetCitys : function() {
			var _this = this;
			return _this.GetCity(_this.MapResult['res']);
		},

		GetMapDetail : function(id) {
			var _this = this;
			return _this.MapResult["res"][id]["path"];

		},

		httpget : function($http, $sce, StartCity, EndCity, date, cb) {
			var _this = this;

			//http://xx.xx.xx.xx/get?StartCity=/*&EndCity=/**/*/
			var rest = encodeURI($sce.trustAsResourceUrl("/query?StartCity=" + StartCity + "&EndCity=" + EndCity + "&date=" + date));

			//var rest = "http://www.baidu.com"
			$http.get($sce.trustAsResourceUrl(rest)).success(function(data) {
				_this.MapResult = data;
				console.log(data);
				cb();
			});

			//return _this.GetCity(_this.MapResult['res']);

		},
	};

	return MapList;
})

.factory('SpecialListService', function() {

	var SpecialList = {
		skip : 0,
		special_offer_list : [],
		top : 0,

		init : function() {
			var _this = this;
		},

		httpget : function ($http, end, special_offer_l, c1) {
			var _this = this;
			if (end == false) {

				var json = {"type":"travelling","limit":20,"skip":_this.skip};
				var rest = encodeURI("/special_offer/search?json=" + JSON.stringify(json));

				$http.get(rest).success(function(data) {

					for (var i in data) {
						_this.special_offer_list.push(data[i]);
						special_offer_l.push(data[i]);
					}
					if (data.length != 0) {
						_this.skip += data.length;
					} else {
						end = true;
					}
					/*
					for (var i in _this.special_offer_list) {
						special_offer_l.push(_this.special_offer_list[i]);
					}
					*/

					c1();
				});
			}
		},

		GetOne : function($http, id, cb) {
			var _this = this;
			for (x in _this.special_offer_list) {
				if (x['_id'] == id) {
					cb(x);
					return;
				}
			}
	
			json = {"limit":20,"skip":0};
			json['_id'] = id; 

			var rest = encodeURI("/special_offer/search?json=" + JSON.stringify(json));

			$http.get(rest).
				success(function(data) {
					cb(data[0])
				});	
		},

		SetTop : function (top) {
			var _this = this;
			_this.top = top;

			console.log("this top " + _this.top);
		},

		GetTop : function () {
			var _this = this;
			return _this.top;
		},


	};

	return SpecialList;
});
