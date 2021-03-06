var async = require('async');
var log = require('./log.js')("debug");
var TrainDAO = require('./train.js');
var CoachDAO = require('./coach.js');
var LocationDAO = require('./location.js');
var T = "train";
var C = "coach";
var CT = "coachtrain";

var total_query_count = 0;
exports.queryTransport = function(req, res) {
  try {
    total_query_count++;
    console.log("TOTAL QUERY COUNT: " + total_query_count);
    var info = {};
    info.srcCity = req.query.StartCity;
    info.destCity = req.query.EndCity;
    info.srcStation = null;
    info.destStation = null;
    info.date = req.query.date;
    //debugger;
    var transCollection = queryEnginee(info, function(err, transCollection) {
      if (transCollection == null) {
        console.log("queryEnginee Failed: " + err);
        var result = {
          "res": []
        };
        res.send(result);
      } else {
        res.send(transCollection);
      }
    });
  } catch (e) {
    log.error('\r\nError Message: ' + e);
    log.error('\r\nError Stack: ' + e.stack);

    var result = {
      "res": []
    };
    res.send(result);

  }
}


function queryEnginee(transInfo, cb) {
  console.log("Start Query...");

  var collection;
  var srcStation = transInfo.srcStation;
  var destStation = transInfo.destStation;
  var srcCity = transInfo.srcCity;
  var destCity = transInfo.destCity;

  var date = transInfo.date;
  console.log(date);

  queryByCity(srcCity, destCity, date, function(err, results) {
    if (results == null) {
      console.log("queryByCity Failed: " + err);
      cb(null, null);
    } else {
      //debugger;
      console.log("queryByCity Success");
      cb(null, results);
    }
  });
}


function queryByCity(srcCity, destCity, date, cbByCity) {
  console.log("Start queryByCity...");

  var results = {};

  var trainHandler = function(cbCollecTrain) {
    console.log("trainHandler start");
    doQueryTrain(srcCity, destCity, date, function(err, collections) {
      if (collections == null) {
        console.log("trainHandler Failed");
        cbCollecTrain(null, null);
      } else {
        console.log("trainHandler success");
        cbCollecTrain(null, collections);
      };

    });
  }

  var coachHandler = function(cbCollecCoach) {
    console.log("coachHandler start");
    queryCoach(srcCity, destCity, date, function(err, infoCC) {
      debugger;
      if (infoCC == null) {
        console.log("coachHandler Failed");
        cbCollecCoach(null, null);
      } else {
        console.log("coachHandler success");

        var results = {};
        var collections = [];
        var CCColections = infoCC.res;
        for (var i = 0; i < CCColections.length; ++i) {

          var CCpathSet = CCColections[i];
          var pathSet = {};
          var paths = [];
          //var detailPath = {};
          //detailPath.element = [];

          for (var j = 0; j < CCpathSet.path.length; ++j) {
            var path = CCpathSet.path[j];

            var detailPath = {};
            detailPath.element = CCpathSet.path[j];

            detailPath.total_price = 0.0;
            detailPath.total_time = 0.0;
            var k = 0;
            for (; k < detailPath.element.length; ++k) {
              detailPath.total_price += getLowestPrice(detailPath.element[k].price_list);
              detailPath.total_time += minutesMinus(detailPath.element[k].depart_time, detailPath.element[k].arrive_time);
              if (k + 1 < detailPath.element.length) {
                detailPath.total_time += minutesMinus(detailPath.element[k].arrive_time, detailPath.element[k + 1].depart_time);
              }
            }


            paths.push(detailPath);
          }
          pathSet.city = CCpathSet.city;
          pathSet.path = paths;
          collections.push(pathSet);

        }
        console.log("CC collections: " + collections);
        debugger;
        cbCollecCoach(null, collections);
      }
    });
  };

  var resHandler = function(err, asyncRes) {
    console.log("resHandler Enter...");
    if (err) {
      console.log("resHandler Error");
      cbByCity(null, null);
    } else {
      if (asyncRes.collectionsTrain || asyncRes.collectionsCoach) {
        console.log("resHandler success");

        if (asyncRes.collectionsCoach != null) {
          for (var i = 0; i < asyncRes.collectionsCoach.length; ++i) {
            asyncRes.collectionsTrain.push(asyncRes.collectionsCoach[i]);
          }
        }
        results.res = asyncRes.collectionsTrain;
        cbByCity(null, results);
      }
    }
  };

  var parallelTasks = {
    collectionsTrain: trainHandler,
    collectionsCoach: coachHandler
  };

  async.parallel(parallelTasks, resHandler)

}


function doQueryTrain(srcCity, destCity, date, cbDoQueryTrain) {
  queryTrain(srcCity, destCity, date, function(err, infoTT) {
    if (infoTT == null) {
      console.log("queryTrain Failed: " + err);
      cbDoQueryTrain(null, null);
    } else {
      console.log("queryTrain success");
      var results = {};
      var collections = [];
      var TTCollections = infoTT.res;


      var taskList = [];
      var index = -1;
      for (collec in TTCollections) {
        var task = function(cbTask) {
          index++;
          var TTpathSet = TTCollections[index];
          var cityLength = TTpathSet.city.length;



          var pattsrcCity = new RegExp(TTpathSet.city[0]);
          var pattdestCity = new RegExp(TTpathSet.city[cityLength - 1]);

          //火火，直接返回----------------------
          if (pattsrcCity.test(srcCity) && pattdestCity.test(destCity)) {
            var paths = [];
            var pathSet = {};
            console.log("TT...");
            paths = Train2Train(TTpathSet);

            pathSet.city = TTpathSet.city;
            pathSet.path = paths;

            console.log("TT collections: " + collections);
            cbTask(null, pathSet);
          }


          //火汽------------------------------
          if (pattsrcCity.test(srcCity) && !pattdestCity.test(destCity)) {
            var paths = [];
            var pathSet = {};
            console.log("TC...");
            queryCoach(TTpathSet.city[cityLength - 1], destCity, date, function(err, infoCC) {
              debugger;
              if (infoCC == null) {
                console.log("queryCoach Failed: " + err);
                //cbCollecTrain(null, null);
              } else {
                console.log("queryCoach success: " + err);
                var CCColections = infoCC.res;
                for (var j = 0; j < CCColections.length; ++j) {
                  
                  var CCpathSet = CCColections[j];
                  var pathSet = assemblePoint(TTpathSet, CCpathSet, T); //失败的话 怎么办
                  console.log("TC collections: " + collections);
                  cbTask(null, pathSet);
                }
              }
            });
          }

          //汽火-------------------------------
          if (!pattsrcCity.test(srcCity) && pattdestCity.test(destCity)) {
            var paths = [];
            var pathSet = {};
            console.log("CT...");
            queryCoach(srcCity, TTpathSet.city[0], date, function(err, infoCC) {
              if (infoCC == null) {
                console.log("queryCoach Failed: " + err);
                //cbCollecTrain(null, null);
              } else {

                console.log("queryCoach success");

                var CCColections = infoCC.res;
                for (var j = 0; j < CCColections.length; ++j) {
                  var CCpathSet = CCColections[j];
                  //debugger;
                  var pathSet = assemblePoint(TTpathSet, CCpathSet, C); //失败的话 怎么办
                  //collections.push(pathSet);
                  console.log("CT collections: " + collections);
                  cbTask(null, pathSet);
                }
              }
            });
          }

          //汽火汽-------------------------------
          if (!pattsrcCity.test(srcCity) && !pattdestCity.test(destCity)) {
            var paths = [];
            var pathSet = {};
            console.log("CTC...");
            async.parallel({
                srcInfoCC: function(cb) {
                  queryCoach(srcCity, TTpathSet.city[0], date, function(err, infoCC) {
                    if (infoCC == null) {
                      console.log("queryCoach Failed for srcInfoCC in async1: " + err);
                      cb(null, null);
                    } else {
                      console.log("queryCoach success");
                      cb(null, infoCC);
                    }
                  });
                },
                destInfoCC: function(cb) {
                  queryCoach(TTpathSet.city[cityLength - 1], destCity, date, function(err, infoCC) {
                    if (infoCC == null) {
                      console.log("queryCoach Failed for destInfoCC in async2: " + err);
                      cb(null, null);
                    } else {
                      console.log("queryCoach success");
                      cb(null, infoCC);
                    }
                  });
                }
              },
              function(err, asyncRes) {
                if (infoCC != null) {
                  //汽车查询结果，只会有一组城市数据（pathSet）
                  var srcCCpathSet = asyncRes.srcInfoCC.res[0];
                  var destCCpathSet = asyncRes.destInfoCC.res[0];

                  var pathSet = doCoach2Coach(TTpathSet, srcCCpathSet, destCCpathSet);

                  //collections.push(pathSet);
                  console.log("TT collections: " + collections);
                  cbTask(null, pathSet);
                }
              }
            );
          }
        }

        taskList.push(task);
      }

      var resHandler = function(err, asyncRes) {
        console.log("async doQueryTrain Enter...");
        if (err) {
          console.log("async doQueryTrain Error");
          cbDoQueryTrain(null, null);
        }
        if (asyncRes.length) {
          console.log("async doQueryTrain Error");
          var collections = assembleTrainCollection(asyncRes);
          cbDoQueryTrain(null, collections);
        }
      }

      async.parallel(taskList, resHandler);

    }

  });
}


function assembleTrainCollection(asyncRes) {
  var collections = [];
  for (var i = 0; i < asyncRes.length; ++i) {
    var pathSet = asyncRes[i];
    collections.push(pathSet);
  }
  debugger;
  return collections;
}




function queryTrain(srcCity, destCity, date, cb) {
  console.log("Start queryTrain...");
  TrainDAO.getTrainPath(null, srcCity, null, destCity, date, function(info) {
    if (!info || !info.res) {
      console.log("TrainDAO.getTrainPath Failed");
      cb(null, null);
    } else {
      //debugger;
      console.log("TrainDAO.getTrainPath success");
      cb(null, info);
    }
  });
}



function queryCoach(srcName, destName, date, cb) {
  console.log("Start queryCoach...");

  CoachDAO.getCoachPath(null, srcName, null, destName, date, function(info) {
    if (!info || !info.res) {
      console.log("CoachDAO.getCoachPath Failed");
      cb(null, null);
    } else {
      console.log("CoachDAO.getCoachPath success");
      cb(null, info);
    }
  });
}



function Train2Train(TTpathSet) {
  console.log("Start Train2Train...");
  var paths = [];

  for (var j = 0; j < TTpathSet.path.length; ++j) {
    var path = TTpathSet.path[j];
    var detailPath = {};
    detailPath.element = [];

    detailPath.total_price = 0.0;
    detailPath.total_time = 0.0;
    var k = 0;
    for (; k < path.length; ++k) {
      detailPath.element.push(path[k]);
      //console.log(path[k].price_list);
      //debugger;
      detailPath.total_price += getLowestPrice(path[k].price_list);
      detailPath.total_time += minutesMinus(path[k].depart_time, path[k].arrive_time);
      if (k + 1 < path.length) {
        detailPath.total_time += minutesMinus(path[k].arrive_time, path[k + 1].depart_time);
      }
    }
    //detailPath.total_time += minutesMinus(path[k].depart_time, path[k].arrive_time);

    paths.push(detailPath);
  }
  return paths;
}



function doCoach2Coach(TTpathSet, srcPathSet, destPathSet) {

  //先汽火
  var CTPathSet = assemblePoint(TTpathSet, srcPathSet, C); //这儿类型为C，表示第二个参数为主，第一个为辅
  //再拼汽车
  var pathSet = assemblePoint(CTPathSet, destPathSet, CT); //这儿类型为T，表示第一个参数为主，第二个为辅

  return pathSet;
}



//能进入该函数的，火汽城市必然相同，因为汽车查询函数只有成功才能进来
function assemblePoint(TTpathSet, CCpathSet, headType) {
  var pathSet = {};
  var paths = [];

  //火拼汽
  if (headType == T) {
    console.log("assemblePoint for TC");
    //debugger;
    for (var i = 0; i < TTpathSet.path.length; ++i) {
      var TTpath = TTpathSet.path[i];
      for (var j = 0; j < CCpathSet.path.length; ++j) {
        var CCpath = CCpathSet.path[j];

        console.log("TTpath: " + TTpath);
        var timeGap = minutesGap(TTpath[TTpath.length - 1].arrive_time, CCpath[0].depart_time); //一定要注意这儿的第二个下标取值
        
        //中间需要间隔30mins
        if (timeGap > 30) {
          //可以对接
          var detailPath = {};
          detailPath.element = doAssemble(TTpath, CCpath, headType);


          detailPath.total_price = 0.0;
          detailPath.total_time = 0.0;
          var k = 0;
          for (; k < detailPath.element.length; ++k) {
            detailPath.total_price += getLowestPrice(detailPath.element[k].price_list);
            detailPath.total_time += minutesMinus(detailPath.element[k].depart_time, detailPath.element[k].arrive_time);
            if (k + 1 < detailPath.element.length) {
              detailPath.total_time += minutesMinus(detailPath.element[k].arrive_time, detailPath.element[k + 1].depart_time);
            }
          }
          paths.push(detailPath);
        }
      }
    }

    //如果当天没有数据，则对接到第二天
    if(paths.length == 0)
    {
      for (var i = 0; i < TTpathSet.path.length; ++i) {
        var TTpath = TTpathSet.path[i];
        for (var j = 0; j < CCpathSet.path.length; ++j) {
          debugger;
          var CCpath = CCpathSet.path[j];

          console.log("TTpath: " + TTpath);
          var timeGap = minutesGap(TTpath[TTpath.length - 1].arrive_time, CCpath[0].depart_time); //一定要注意这儿的第二个下标取值
          
          //中间需要间隔30mins
          if (timeGap > -10000) {
            //可以对接
            var detailPath = {};
            detailPath.element = doAssemble(TTpath, CCpath, headType);


            detailPath.total_price = 0.0;
            detailPath.total_time = 0.0;
            var k = 0;
            for (; k < detailPath.element.length; ++k) {
              detailPath.total_price += getLowestPrice(detailPath.element[k].price_list);
              detailPath.total_time += minutesMinus(detailPath.element[k].depart_time, detailPath.element[k].arrive_time);
              if (k + 1 < detailPath.element.length) {
                //需要将第二天时间更改格式

                //detailPath.element[k + 1].depart_time = formatTime2Tomorrow(detailPath.element[k + 1].depart_time);
                detailPath.total_time += minutesMinus(detailPath.element[k].arrive_time, detailPath.element[k + 1].depart_time);
                //detailPath.element[k + 1].arrive_time = formatTime2Tomorrow(detailPath.element[k + 1].arrive_time);
              }
            }
            paths.push(detailPath);
          }
        }
      }
    }

    console.log("T+C assembelCity");
    pathSet.city = assembelCity(TTpathSet.city, CCpathSet.city, headType);
  }

  //汽＋火 拼 汽
  if (headType == CT) {
    var CTpathSet = TTpathSet;
    console.log("assemblePoint for CTC");
    for (var i = 0; i < CTpathSet.path.length; ++i) {
      var CTpath = CTpathSet.path[i].element;

      for (var j = 0; j < CCpathSet.path.length; ++j) {
        var CCpath = CCpathSet.path[j];

        //console.log("CTpath: " + CTpath);
        var timeGap = minutesMinus(CTpath[CTpath.length - 1].arrive_time, CCpath[0].depart_time); //一定要注意这儿的第二个下标取值

        //中间需要间隔30mins
        if (timeGap > 30) {
          //可以对接
          var detailPath = {};
          detailPath.element = doAssemble(CTpath, CCpath, headType);

          detailPath.total_price = 0.0;
          detailPath.total_time = 0.0;
          var k = 0;
          for (; k < detailPath.element.length; ++k) {
            detailPath.total_price += getLowestPrice(detailPath.element[k].price_list);
            detailPath.total_time += minutesMinus(detailPath.element[k].depart_time, detailPath.element[k].arrive_time);
            if (k + 1 < detailPath.element.length) {
              detailPath.total_time += minutesMinus(detailPath.element[k].arrive_time, detailPath.element[k + 1].depart_time);
            }
          }
          paths.push(detailPath);
        }


      }
    }
    console.log("CTpathSet.city: " + CTpathSet.city);
    console.log("CCpathSet.city: " + CCpathSet.city);
    pathSet.city = assembelCity(CTpathSet.city, CCpathSet.city, headType);
    console.log("assembelCity finished: " + pathSet.city);
  }

  //汽拼火
  if (headType == C) {
    console.log("assemblePoint for CT");
    for (var i = 0; i < CCpathSet.path.length; ++i) {
      var CCpath = CCpathSet.path[i];
      for (var j = 0; j < TTpathSet.path.length; ++j) {
        var TTpath = TTpathSet.path[j];
        var timeGap = minutesMinus(CCpath[CCpath.length - 1].arrive_time, TTpath[0].depart_time); //一定要注意这儿的第二个下标取值

        //中间需要间隔30mins
        if (timeGap > 30) {
          //可以对接
          var detailPath = {};
          detailPath.element = doAssemble(TTpath, CCpath, headType);


          detailPath.total_price = 0.0;
          detailPath.total_time = 0.0;
          var k = 0;
          for (; k < detailPath.element.length; ++k) {
            detailPath.total_price += getLowestPrice(detailPath.element[k].price_list);
            detailPath.total_time += minutesMinus(detailPath.element[k].depart_time, detailPath.element[k].arrive_time);
            if (k + 1 < detailPath.element.length) {
              detailPath.total_time += minutesMinus(detailPath.element[k].arrive_time, detailPath.element[k + 1].depart_time);
            }
          }
          paths.push(detailPath);
        }
      }
    }


    //如果当天没有数据，则对接到第二天
    if(paths.length == 0)
    {
      for (var i = 0; i < TTpathSet.path.length; ++i) {
        var TTpath = TTpathSet.path[i];
        for (var j = 0; j < CCpathSet.path.length; ++j) {
          var CCpath = CCpathSet.path[j];

          console.log("TTpath: " + TTpath);
          var timeGap = minutesGap(TTpath[TTpath.length - 1].arrive_time, CCpath[0].depart_time); //一定要注意这儿的第二个下标取值
          
          //中间需要间隔30mins
          if (timeGap > -10000) {
            //可以对接
            var detailPath = {};
            detailPath.element = doAssemble(TTpath, CCpath, headType);


            detailPath.total_price = 0.0;
            detailPath.total_time = 0.0;
            var k = 0;
            for (; k < detailPath.element.length; ++k) {
              detailPath.total_price += getLowestPrice(detailPath.element[k].price_list);
              detailPath.total_time += minutesMinus(detailPath.element[k].depart_time, detailPath.element[k].arrive_time);
              if (k + 1 < detailPath.element.length) {
                //需要将第二天时间更改格式
                //detailPath.element[k + 1].depart_time = formatTime2Tomorrow(detailPath.element[k + 1].depart_time);
                detailPath.total_time += minutesMinus(detailPath.element[k].arrive_time, detailPath.element[k + 1].depart_time);
                //detailPath.element[k + 1].arrive_time = formatTime2Tomorrow(detailPath.element[k + 1].arrive_time);
              }
            }
            paths.push(detailPath);
          }
        }
      }
    }

    console.log("TTpathSet.city: " + TTpathSet.city);
    console.log("CCpathSet.city: " + CCpathSet.city);
    pathSet.city = assembelCity(TTpathSet.city, CCpathSet.city, headType);
  }
  pathSet.path = paths;

  return pathSet;
}


function doAssemble(TTpath, CCpath, headType) {
  debugger;
  var path = [];
  if (headType == T || headType == CT) {
    for (var i = 0; i < TTpath.length; ++i)
      path.push(TTpath[i]);
    for (var i = 0; i < CCpath.length; ++i)
      path.push(CCpath[i]);
  } else {
    for (var i = 0; i < CCpath.length; ++i)
      path.push(CCpath[i]);
    for (var i = 0; i < TTpath.length; ++i)
      path.push(TTpath[i]);
  }
  return path;
}


function assembelCity(TTCity, CCCity, headType) {
  console.log("assembelCity for: " + headType);
  debugger;
  if (headType == T || headType == CT) {
    for (var i = 0; i < CCCity.length; ++i) {
      TTCity.push(CCCity[i])
    }
    return TTCity;
  } else {
    for (var i = 0; i < TTCity.length; ++i) {
      CCCity.push(TTCity[i])
    }
    return CCCity;
  }

}


function getLowestPrice(price_list) {
  if (price_list == null || price_list.length == 0)
    return 0;
  console.log("price_list: " + price_list);

  var lowest = parseFloat(price_list[0].price);
  for (var i = 0; i < price_list.length; ++i) {
    if (lowest > parseFloat(price_list[i].price)) {
      lowest = parseFloat(price_list[i].price);
    }
  }

  return lowest;
}


function queryCityByStation(stationName, cb) {
  LocationDAO.queryCityByStation(stationName, function(err, cityName) {
    cb(err, cityName);
  });
}


function collectTrain2Train(info) {
  //等待火车json拼接
}


//返回分钟数给孟B
function minutesMinus(early_time, later_time) {
  //console.log("later_time: " + later_time);
  //console.log("early_time: " + early_time);

  var minusDay = parseInt(later_time.substring(0, 1)) - parseInt(early_time.substring(0, 1));
  minusDay = (minusDay < 0) ? 0 : minusDay;
  var earlyHourMin = early_time.substring(1).split(":");
  var laterHourMin = later_time.substring(1).split(":");
  var earlyHour = parseFloat(earlyHourMin[0]);
  var earlyMin = parseFloat(earlyHourMin[1]);
  var laterHour = parseFloat(laterHourMin[0]);
  var laterMin = parseFloat(laterHourMin[1]);


  var minusHour = laterHour - earlyHour;
  var minusMin = laterMin - earlyMin;

  if (minusDay == 0) {
    if (laterHour < earlyHour) {
      minusHour = laterHour - earlyHour + 24;
    } else if (laterHour == earlyHour && laterMin < earlyMin) {
      minusHour = laterMin - earlyMin + 24;
    }
  }



  var minusTime = minusDay * 24 * 60 + minusHour * 60 + minusMin;
  //var early_total_time = parseFloat(early_time.substring(0, 1)) * 24 * 60 + parseFloat(earlyHourMin[0]) * 60 + parseFloat(earlyHourMin[1]) ;
  //var later_total_time = parseFloat(later_time.substring(0, 1)) * 24 * 60 + parseFloat(laterHourMin[0]) * 60 + parseFloat(laterHourMin[1]) ;

  //var duringMins;
  //if(later_total_time > early_total_time)
  //   duringMins = later_total_time - early_total_time;

  //var mins =  (minusDay * 24 * 60 + parseFloat(later[0]) - parseFloat(early[0])) * 60.0 + (parseFloat(later[1]) - parseFloat(early[1]));
  //console.log("minusTime: " + minusTime);
  //return mins;
  return minusTime;
}



//乘车间隙
function minutesGap(early_time, later_time) {
  var earlyHourMin = early_time.substring(1).split(":");
  var laterHourMin = later_time.substring(1).split(":");
  var earlyHour = parseFloat(earlyHourMin[0]);
  var earlyMin = parseFloat(earlyHourMin[1]);
  var laterHour = parseFloat(laterHourMin[0]);
  var laterMin = parseFloat(laterHourMin[1]);

  return (laterHour - earlyHour) * 60 + laterMin - earlyMin;
}


function parseTime(timeStr) {
  var dateStr = Date().toDateString();
  return Date(dateStr + timeStr);
}

function formatTime2Tomorrow(timeStr) {
  var temp = (parseInt(timeStr.substring(0, 1)) + 1).toString();
  return temp + timeStr.substring(1);
}
exports.queryEnginee = queryEnginee;