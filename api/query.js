
var async = require('async.js');
var LocationDAO = require('location.js'); 
var TrainDAO = require('train.js'); 
var CoachDAO = require('coach.js'); 
var T = "train"; 
var C = "coach";


exports.queryStation = function(req, res) {
   console.log("Start Query Station: " + req.stationName);

   //是否需要station组装操作，将信息标记火，汽
   LocationDAO.collectStationByCity(req.stationName, function(stationCollection, err){
       if(err){
           res.send({'success':false, 'info':err});
       }else{
           res.send({'success':true, 'info':stationCollection});
           //res.status(200).json({'success':true, 'info':stationCollection})
   })
}

exports.queryTransport = function(req, res) {
   var transCollection = queryEnginee(req.body, function(transCollection){
       if(transCollection != null)
           res.send({'success':true, 'info':transCollection}); }
   });


function queryEnginee(transInfo, cb){
   var collection;
   var srcInfo = transInfo.src;
   var destInfo = transInfo.dest;

   console.log("Start Query...");

   var func = function(collection){
       cb(collection);
   };

   for(var iterSrc in srcInfo){
       for(var iterDest in destInfo)
       {
           //火，火
           if(srcInfo[iterSrc].type == T && destInfo[iterDest].type == T)
           {
               Train2Train(srcInfo[iterSrc].name, destInfo[iterDest].name, func};
           }
           //火，汽
           if(srcInfo[iterSrc].type == T && destInfo[iterDest].type == C)
           {
               Train2Coach(srcInfo[iterSrc].name, destInfo[iterDest].name, func);
           }
           //汽, 火
           if(srcInfo[iterSrc].type == C && destInfo[iterDest].type == T)
           {
               Coach2Train(srcInfo[iterSrc].name, destInfo[iterDest].name, func);
           }
           //汽, 汽
           if(srcInfo[iterSrc].type == C && destInfo[iterDest].type == C)
           {
               Coach2Coach(srcInfo[iterSrc].name, destInfo[iterDest].name, func);
           }

       }
   }
}

function Train2Train(srcName, destName, cb){
   var func = function(infoTT){
       var collection = {"res":[]};
       for(int i = 0; i < info.length; ++i)
       {
           collection.push({"path":infoTT[i]});
       }

       cb(collection);
   };

   queryTrain(srcName, destName, func);

}

function Train2Coach(srcName, destName, cb){
   int scale = 0;
   //最多scale次数
   int count = 1;
   do
   {
       var func = function(destCollection){
           if(destCollection == null)
               continue;
           else
           {
               for(var iter in destCollection)
               {
                   var pair = destCollection[iter];

                   var funcTT = function(infoTT){
                       for(var iterCo in pair.coach)
                       {
                           queryCoach(pair.coach[iterCo].name, destName, function(infoCC){
                               var path = assemblePoint(infoTT, infoCC, T);//失败的话 怎么办
                               cb(path);
                           });
                       }
                   };

                   queryTrain(srcName, pair.train.name, funcTT);
               }
               break;
           }
       }

       scale = scale + 100;
       //先去location拿地址
       queryScale(destName, scale, func);

   }while(count--);
}

function Coach2Train(srcName, destName, cb){
   int scale = 0;
   //最多scale次数
   int count = 3;
   do
   {
       scale = scale + 100;
       //先去location拿地址
       var func = function(srcCollection) {
           if(srcCollection == null)
               continue;
           else
           {
               for(var iter in srcCollection)
               {
                   var pair = srcCollection[iter];
                   var infoTT = queryTrain(pair.train.name, destName, function(infoTT){
                       for(var iterCo in pair.coach)
                       {
                           queryCoach(srcName, pair.coach[iterCo].name, function(infoCC){
                               var path = assemblePoint(infoTT, infoCC, C);//失败的话 怎么办
                               cb(path);
                           });
                       }
                   });

               }
               break;
           }
       };

       queryScale(srcName, scale, func);

   }while(count--);
}


function doCoach2Coach(srcName, srcCollection, destName, destCollection, cb){

   for(var iterSrc in srcCollection)
   {
       var pairSrc = srcCollection[iterSrc];
       for(var iterDest in destCollection)
       {
           var pairDest = destCollection[iterDest];
           //火火
           queryTrain(pairSrc.name, pairDest.name, function(infoTT){
               //src汽汽
                   queryCoach(srcName, pairSrc.name, function(infoCCSrc){
                       paths1 = assemblePoint(infoTT, infoCCSrc, C);//失败的话 怎么办
                   });

               //dest汽汽
                   queryCoach(pairDest.name, destName, function(infoCCSrc){
                       paths2 = assemblePoint(infoTT, infoCCSrc, T);//失败的话 怎么办
                   });

           });
           //最后进行二级拼接
           var collection = assemblePath(paths1, paths2);
           cb(collection);
       }
   }
}




function Coach2Coach(srcName, destName, cb2){
   int srcScale = 100, destScale = 100;
   var srcCollection = null, destCollection = null;
   int srcCount = 3, destCount = 3;

   var paths1, paths2;



   async.parallel({
       srcLocation: function(cb){
           queryScale(srcName, scale, function(srcCollection){
               if(srcCollection == null)
                   console.log("queryScale null for srcCollection!");
               cb(null, srcCollection);
           });
       },
       destLocation: function(cb){
           queryScale(destName, scale, function(destCollection){
               if(destCollection == null)
                   console.log("queryScale null for destCollection!");
               cb(null, destCollection);
           });
       }
   },
   function(err, results){
       if(err == null)
       {
           console.log("queryScale Error");
           return;
       }
       var srcCollection = results.srcCollection;
       var destCollection = results.destCollection;

       doCoach2Coach(srcName, srcCollection, destName, destCollection, function(collection){
           cb2(collection);
       });

   }
   });




}



function queryTrain(srcName, destName, cb){
   TrainDao.query(srcName, destName, function(err, info){
       if(err)
       {
           console.log("TrainDao.query Failed: " + err);
       }
       cd(info);
   }); 
}

function queryCoach(srcName, destName, cb){
   CoachDao.query(srcName, destName, function(err, info){
       if(err)
       {
           console.log("TrainDao.query Failed: " + err);
       }
       cd(info);
   }); 
}

function queryScale(name, scale, cb){
   LocationDAO.collectStationByScale(name, scale, function(err, collection){
       if(err)
       {
           console.log("quertStationByScale error: " + err);
       }
       cb(err, collection);
   });
}

function assemblePoint(infoTT, infoCC, headType){
   var pathCount = 0;
   var res = {"res":[]};
   //火拼汽
   if(headType == T)
   {
       for(var iterT in infoTT)
       {
           for(var iterC in infoCC)
           {
               var destTime = parseTime(infoTT[iterT].res.timeDest);
               var srcTime = parseTime(infoCC[iterC].res.timeSrc);

               //中间需要间隔60mins
               if(destTime.setMinutes(60) < srcTime)
               {
                   //可以对接
                   var path = doAssemble(infoTT[iterT].res, infoCC[iterC].res, headType);
                   pathCount++;
                   res[pathCount] = path;
               }
           }
       }
   }
   //汽拼火
   if(headType = C)
   {
       for(var iterC in infoCC)
       {
           for(var iterT in infoTT)
           {
               var destTime = parseTime(infoCC[iterC].res.timeDest);
               var srcTime = parseTime(infoTT[iterT].res.timeSrc);

               //中间需要间隔60mins
               if(destTime.setMinutes(60) < srcTime)
               {
                   //可以对接
                   var path = doAssemble(infoTT[iterT].res, infoCC[iterC].res, headType);
                   pathCount++;
                   res[pathCount] = path;
               }
           }
       }
   }

   return res;
}


function parseTime(timeStr){
   var dateStr = Date().toDateString();
   return Date(dateStr + timeStr);
}

function doAssemble(trans1, trans2, headType){ 
   var type1, type2;
   if(headType = T)
   {
       type1 = T;
       type2 = C;
   }
   else
   {
       type1 = C;
       type2 = T;
   }

   var ret = {"path":[ +
       {"type":type1,'name':trans1.name, "stationSrc":trans1.stationSrc, "stationDest":trans1.stationDest, 'timeSrc':trans1.timeSrc, 'timeDest':trans1.timeDest, 'cost':trans1.cost}, +
       {"type":type2,'name':trans2.name, "stationSrc":trans2.stationSrc, "stationDest":trans2.stationDest, 'timeSrc':trans2.timeSrc, 'timeDest':trans2.timeDest, 'cost':trans2.cost} +
   ]};
   return ret;
}

function assemblePath(paths1, paths2){
   var joint = {"res":[]};
   int jointCount = 0;

   for(int i = 0; i < paths1.res.length; ++i)
   {
       for(int j = 0; j < paths1.res.length; ++j)
       {
           if(paths1.res[i].path[2].name == paths2.res[j].path[1].name)
           {
               //可以拼接,直接在paths1的path元素的最后push入paths2的最后一条
               var path = paths1Tmp.res[i].path;
               path.push(paths2.res[i].path[2]);
               joint[jointCount].push(path);
               jointCount++;
           }
       }
   }

   return joint;
}



//Coach>>>>>>>>>>>>>query ??????//同一车次每隔半小时一班
{
"res":
   [
       {"name":"1234-1", "stationSrc":"A", "stationDest":"B", "timeSrc":"08:00:00", "timeDest":"15:00:00", "cost":"60"},
       {"name":"1234-2", "stationSrc":"A", "stationDest":"B", "timeSrc":"09:00:00", "timeDest":"16:00:00", "cost":"60"},
       {"name":"1234-3", "stationSrc":"A", "stationDest":"B", "timeSrc":"10:00:00", "timeDest":"17:00:00", "cost":"60"}
   ]
}

//query>>>>>>>>>>>>>>client step 2
{
"res":
   [
   {
       "point":['A','B','C'],
       "path":
       [
           [
               {"type":"coach", "name":"c1234", "timeSrc":"08:00:00","timeDest":"10:00:00","cost":"60"},
               {"type":"train", "name":"D5240", "timeSrc":"10:40:00","timeDest":"13:40:00","cost":"150"}
           ],
           [
               {"type":"coach", "name":"c1235", "timeSrc":"09:00:00","timeDest":"11:00:00","cost":"60"},
               {"type":"train", "name":"D5241", "timeSrc":"12:00:00","timeDest":"15:20:00","cost":"150"}
           ]
       ]
   },
   {  

       "point":['A','F','C'],
       "path":
       [
           [
               {"type":"coach", "name":"c1234","timeSrc":"08:00:00","timeDest":"10:00:00","cost":"60"},
               {"type":"train", "name":"D5240", "timeSrc":"10:40:00","timeDest":"13:40:00","cost":"150"}
           ],
           [
               {"type":"coach", "name":"c1235", "timeSrc":"09:00:00","timeDest":"11:00:00","cost":"60"},
               {"type":"train", "name":"D5241", "timeSrc":"12:00:00","timeDest":"15:20:00","cost":"150"}
           ]
       ]
   }
   ]
}





