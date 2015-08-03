(function () {

	'use strict';

	/* Services */

	var im = function() {
		this.data  = '123456';
		this.conn  = new Easemob.im.Connection();
	};

	im.prototype.open = function(c) {
		this.conn.open({
			user : c.username,
			pwd :  c.password,
			//连接时提供appkey
			appKey : 'helloorange#vtrip'
		});
	};

	im.prototype.handleOpen = function(conn, c) {
		var _this = this;
		//获取当前登录人的联系人列表
				var curroster;
				for ( var i in roster) {
					var ros = roster[i];
					if (ros.subscription == 'both'
						|| ros.subscription == 'from') {

							console.log(roster[i].name);
						} else if (ros.subscription == 'to') {
							//to表明了联系人是我的单向好友
							console.log(roster[i].name);
						}
				}

				conn.setPresence();
				//获取当前登录人的群组列表
				conn.listRooms({
					success : function(rooms) {
						if (rooms) {
							for (var i in rooms) {
								console.log("rooms is " + rooms[i].name + "   " + rooms[i].roomId);
							}
							c.onOpen({roster: roster, rooms: rooms});
						}
					},
					error : function(e) {

					}
				});
			}
		});
	};

	im.prototype.groupsend = function(c) {
		var _this = this;
		if (c.msg == null || c.msg.length == 0) {
			return;
		}
		if (c.to == null) {
			return;
		}
		var options = {
			to : c.to,
			msg : c.msg,
			type : "groupchat"
		};
		//easemobwebim-sdk发送文本消息的方法 to为发送给谁，meg为文本消息对象
		console.log(options);
		_this.conn.sendTextMessage(options);
	};


	im.prototype.init = function(c) {
		var _this = this;
		this.conn.init({
			//当连接成功时的回调方法
			onOpened : function() {
				console.log("befare onOpen1");
				_this.handleOpen(_this.conn, c);
			},
			onClosed : function() {
				//handleClosed();
			},
			//收到文本消息时的回调方法
			onTextMessage : function(message) {
				console.log('recv message');
				c.handleTextMessage(message);
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
	};

	var phonecatServices = angular.module('phonecatServices', []);

	phonecatServices.factory('Phone', function() {
		var im_new = new im();
		//im_new.init();
		//im_new.open();
		return im_new;
	});


	var SpecialList = function() {
		this.skip = 0;
		this.special_offer_list = [];
		this.top = 0;
	};

	SpecialList.prototype.init = function() {
		var _this = this;
	};

	SpecialList.prototype.httpget = function ($http, end, special_offer_l, c1) {
		var _this = this;
		if (end == false) {

			var json = {"limit":20,"skip":_this.skip};
			var rest = encodeURI("/special_offer/search?json=" + JSON.stringify(json));

			$http.get(rest).success(function(data) {

				for (var i in data) {
					_this.special_offer_list.push(data[i]);
				}
				if (data.length != 0) {
					_this.skip += data.length;
				} else {
					end = true;
				}

				for (var i in _this.special_offer_list) {
					special_offer_l.push(_this.special_offer_list[i]);
				}

				c1();
			});
		}
	};

	SpecialList.prototype.SetTop = function (top) {
		var _this = this;
		_this.top = top;

		console.log("this top " + _this.top);
	};

	SpecialList.prototype.GetTop = function () {
		var _this = this;
		return _this.top;
	};

	phonecatServices.factory('SpecialListService', function() {
		var SpecialListNew = new SpecialList();
		return SpecialListNew;
	});

}());
