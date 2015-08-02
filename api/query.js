var async = require('async');
var log = require('./log.js')("debug");
var TrainDAO = require('./train.js');
var CoachDAO = require('./coach.js');
var T = "train";
var C = "coach";
var CT = "coachtrain";


exports.queryTransport = function(req, res) {
  var transCollection = queryEnginee(req.body, function(err, transCollection) {
      if (err)
        console.log("queryEnginee Failed: " + err);
      else
        res.send({
          'success': true,
          'info': transCollection
        });
  });
}


function queryEnginee(transInfo, cb) {
  console.log("Start Query...");

  var collection;
  var srcStation = transInfo.srcStation;
  var destStation = transInfo.destStation;
  var srcCity = transInfo.srcCity;
  var destCity = transInfo.destCity;

  var date = transInfo.date;
  if (!date)
  {
    var myDate = new Date();
    date = myDate.getFullYear() + "-" + myDate.getMonth() + "-" + myDate.getDate();
  }
  console.log(date);

  queryByCity(srcCity, destCity, date, function(err, results) {
    if(err)
        console.log("queryByCity Failed: " + err);
    debugger;
    log.trace("results: " + results);
    cb(err, results);
  });


}



function queryByCity(srcCity, destCity, date, cb2) {
  console.log("Start queryByCity...");

  var func = function(err, infoTT) {
    if (err) {
      console.log("queryTrain Failed: " + err);
    } else {
      var results = {};
      var collections = [];
      var TTCollections = infoTT.res;

      for (var i = 0; i < TTCollections.length; ++i) {
        var TTpathSet = TTCollections[i];
        var cityLength = TTpathSet.city.length;

        //火火，直接返回----------------------
        if (srcCity == TTpathSet.city[0] && destCity == TTpathSet.city[cityLength - 1]) {
        var paths = [];
        var pathSet = {};
          console.log("TT...");
          paths = Train2Train(TTpathSet);

          pathSet.city = TTpathSet.city;
          pathSet.path = paths;


          collections.push(pathSet);
        }


        //火汽------------------------------
        if (srcCity == TTpathSet.city[0] && destCity != TTpathSet.city[cityLength - 1]) {
        var paths = [];
        var pathSet = {};
          console.log("TC...");
          queryCoach(TTpathSet.city[cityLength - 1], destCity, date, function(err, infoCC) {
            if (err) {
              console.log("queryCoach Failed: " + err);
              return;
            } else {
              var CCColections = infoCC.res;
              for (var j = 0; j < CCColections.length; ++j) {
                var CCpathSet = CCColections[j];
                var pathSet = assemblePoint(TTpathSet, CCpathSet, T); //失败的话 怎么办
                collections.push(pathSet);
              }
            }
          });
        }

        //汽火-------------------------------
        if (srcCity != TTpathSet.city[0] && destCity == TTpathSet.city[cityLength - 1]) {
        var paths = [];
        var pathSet = {};
          console.log("CT...");
          queryCoach(srcCity, TTpathSet.city[0], date, function(err, infoCC) {
            if (err) {
              console.log("queryCoach Failed: " + err);
              return;
            } else {

            console.log("queryCoach success");

              var CCColections = infoCC.res;
              for (var j = 0; j < CCColections.length; ++j) {
                var CCpathSet = CCColections[j];
                //debugger;
                var pathSet = assemblePoint(TTpathSet, CCpathSet, C); //失败的话 怎么办
                collections.push(pathSet);
              }
            }
          });
        }
        var t01, t02;
        //汽火汽-------------------------------
        if (srcCity != TTpathSet.city[0] && destCity != TTpathSet.city[cityLength - 1]) {
        var paths = [];
        var pathSet = {};
          console.log("CTC...");
          async.parallel({
              srcInfoCC: function(cb) {
                queryCoach(srcCity, TTpathSet.city[0], date, function(err, infoCC) {
                  if (err)
                    console.log("queryCoach Failed for srcInfoCC: " + err);
                  else
                  {
                    console.log("queryCoach success");
                     cb(null, infoCC);
                  }
                });
              },
              destInfoCC: function(cb) {
                queryCoach(TTpathSet.city[cityLength - 1], destCity, date, function(err, infoCC) {
                  if (err)
                    console.log("queryCoach Failed for destInfoCC: " + err);
                  else
                  {
                    console.log("queryCoach success");
                     cb(null, infoCC);
                  }
                });
              }
            },
            function(err, asyncRes) {
              if (err) {
                console.log("async Failed: " + err);
                return;
              }
              else
              {
              //汽车查询结果，只会有一组城市数据（pathSet）
              var srcCCpathSet = asyncRes.srcInfoCC.res[0];
              var destCCpathSet = asyncRes.destInfoCC.res[0];

              var pathSet = doCoach2Coach(TTpathSet, srcCCpathSet, destCCpathSet);

              collections.push(pathSet);
            }
            }
          );
        }
      }


      console.log("queryByCity success...");
      console.log("collections: " + collections);
      results.res = collections;
      cb2(null, results);
    }
  };

  queryTrain(srcCity, destCity, date, func);
}


function queryTrain(srcCity, destCity, date, cb) {
  console.log("Start queryTrain...");
  TrainDAO.getTrainPath(null, srcCity, null, destCity, date, function(err, info) {
    if (err) {
      console.log("TrainDAO.query Failed: " + err);
    }
    console.log("queryTrain success");
    cb(null, info);
  });
}


function Train2Train(TTpathSet) {
  console.log("Start Train2Train...");
  var paths = [];

  for (var j = 0; j < TTpathSet.path.length; ++j) {
    var path = TTpathSet.path[j];
    var detailPath = {};

    detailPath.total_price = 0.0;
    detailPath.total_time = minutesMinus(path[0].depart_time, path[path.length - 1].arrive_time);

    for (var k = 0; k < path.length; ++k) {
      detailPath.element = path[k];
      //console.log(path[k].price_list);
      detailPath.total_price += getLowestPrice(path[k].price_list);
    }

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
  var detailPath = [];
  var paths = [];

  //火拼汽
  if (headType == T) {
    console.log("assemblePoint for TC");
    debugger;
    for (var i = 0; i < TTpathSet.path.length; ++i) {
        var TTpath = TTpathSet.path[i];
      for (var j = 0; j < CCpathSet.path.length; ++j) {
        var CCpath = CCpathSet.path[j];

        console.log("TTpath: " + TTpath);
        var timeGap  = minutesMinus(TTpath[TTpath.length - 1].arrive_time, CCpath[0].depart_time); //一定要注意这儿的第二个下标取值

        //中间需要间隔30mins
        if (timeGap  > 30) {
          //可以对接
          var path = doAssemble(TTpath, CCpath, headType);
          detailPath.total_price = 0.0;
          detailPath.total_time = minutesMinus(path[0].depart_time, path[path.length - 1].arrive_time);
          detailPath.element = path;

          for (var k = 0; k < path.length; ++k) {
            detailPath.total_price += getLowestPrice(path[k].price_list);
          }
          paths.push(detailPath);
        }
      }
    }
    pathSet.city = assembelCity(TTpathSet.city, CCpathSet.city, headType);
  }

  //汽＋火 拼 汽
  if (headType == CT) {
    var CTpathSet = TTpathSet;
    console.log("assemblePoint for TC");
    for (var i = 0; i < CTpathSet.path.length; ++i) {
        var CTpath = CTpathSet.path[i].element;

      for (var j = 0; j < CCpathSet.path.length; ++j) {
        var CCpath = CCpathSet.path[j];

        //console.log("CTpath: " + CTpath);
        var timeGap  = minutesMinus(CTpath[CTpath.length - 1].arrive_time, CCpath[0].depart_time); //一定要注意这儿的第二个下标取值

        //中间需要间隔30mins
        if (timeGap  > 30) {
          //可以对接
          var path = doAssemble(CTpath, CCpath, headType);

          detailPath.total_price = 0.0;
          detailPath.total_time = minutesMinus(path[0].depart_time, path[path.length - 1].arrive_time);
          detailPath.element = path;

          for (var k = 0; k < path.length; ++k) {
            detailPath.total_price += getLowestPrice(path[k].price_list);
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
        var timeGap  = minutesMinus(CCpath[CCpath.length - 1].arrive_time, TTpath[0].depart_time); //一定要注意这儿的第二个下标取值

        //中间需要间隔30mins
          if (timeGap  > 30) {
          //可以对接
          var path = doAssemble(TTpath, CCpath, headType);
          detailPath.total_price = 0.0;
          detailPath.total_time = minutesMinus(path[0].depart_time, path[path.length - 1].arrive_time);
          detailPath.element = path;

          for (var k = 0; k < path.length; ++k) {
            detailPath.total_price += getLowestPrice(path[k].price_list);
          }
          paths.push(detailPath);
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


function getLowestPrice(price_list)
{
    var lowest = parseFloat(price_list[0].price);
    for(var i = 0; i < price_list.length; ++i)
    {
        if(lowest > parseFloat(price_list[i].price))
        {
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
  var minusDay = parseInt(later_time.substring(0, 1)) - parseInt(early_time.substring(0, 1));

  var early = early_time.substring(1).split(":");
  var later = later_time.substring(1).split(":");

  return (minusDay * 24 * 60 + parseFloat(later[0]) - parseFloat(early[0])) * 60.0 + (parseFloat(later[1]) - parseFloat(early[1]));

}


function queryCoach(srcName, destName, date, cb) {
  CoachDAO.getCoachPath(null, srcName, null, destName, date, function(err, info) {
    cb(err, info);
  });
}


function parseTime(timeStr) {
  var dateStr = Date().toDateString();
  return Date(dateStr + timeStr);
}


exports.queryEnginee = queryEnginee;





