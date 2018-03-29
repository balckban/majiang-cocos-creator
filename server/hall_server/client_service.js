var crypto = require('../utils/crypto'); //加密工具
var express = require('express'); 
var db = require('../utils/db');  //数据库管理工具
var http = require('../utils/http'); //http 管理工具
var room_service = require("./room_service"); 
//应用级中间件绑定到 app 对象 使用
var app = express();
var config = null;

//判断账号密码都不为空
function check_account(req,res){
	var account = req.query.account;
	var sign = req.query.sign;
	if(account == null || sign == null){
		http.send(res,1,"unknown error");
		return false;
	}
	/*
	var serverSign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
	if(serverSign != sign){
		http.send(res,2,"login failed.");
		return false;
	}
	*/
	return true;
}

//设置跨域访问
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});


//login请求 
app.get('/login',function(req,res){
    //判断账号密码是否为空
    if(!check_account(req,res)){
		return;
	}
	//获取接受的ip
    var ip = req.ip;
    //校验ip
	if(ip.indexOf("::ffff:") != -1){
		ip = ip.substr(7);
	}
	//账号
    var account = req.query.account;
    //从数据库获取用户信息
	db.get_user_data(account,function(data){
        //如果查询为空 返回
        if(data == null){
			http.send(res,0,"ok");
			return;
		}
        //返回数据库查询信息
		var ret = {
			account:data.account,
			userid:data.userid,
			name:data.name,
			lv:data.lv,
			exp:data.exp,
			coins:data.coins,
			gems:data.gems,
			ip:ip,
			sex:data.sex,
		};
        
        //数据库查询房间是否存在
		db.get_room_id_of_user(data.userid,function(roomId){
			//如果用户处于房间中，则需要对其房间进行检查。 如果房间还在，则通知用户进入
			if(roomId != null){
				//检查房间是否存在于数据库中
				db.is_room_exist(roomId,function (retval){
					if(retval){
						ret.roomid = roomId;
					}
					else{
						//如果房间不在了，表示信息不同步，清除掉用户记录
						db.set_room_id_of_user(data.userid,null);
					}
					http.send(res,0,"ok",ret);
				});
			}
			else {
				http.send(res,0,"ok",ret);
			}
		});
	});
});

//创建用户接口 游客登录创建用户名
app.get('/create_user',function(req,res){
    //判断账号密码是否不为空
    if(!check_account(req,res)){
		return;
	}
	var account = req.query.account; //账号
	var name = req.query.name;  //获取名字
	var coins = 1000;//初试金兵
	var gems = 99;//初试房卡
	console.log(name);
    //判断名字用户是否已经存在
	db.is_user_exist(account,function(ret){
        //如果不存在
        if(!ret){
            //数据库创建该用户
			db.create_user(account,name,coins,gems,0,null,function(ret){
               //返回为空 返回错误请求
                if (ret == null) {
					http.send(res,2,"system error.");
				}
				else{
                    //返会ok
					http.send(res,0,"ok");					
				}
			});
		}
		else{
            //用户已经存在
			http.send(res,1,"account have already exist.");
		}
	});
});


//创建房间
app.get('/create_private_room',function(req,res){
	//验证参数合法性
	var data = req.query;
	//验证玩家身份
	if(!check_account(req,res)){
		return;
	}
    //账号
	var account = data.account; 
    //置空
	data.account = null;
	data.sign = null;
    var conf = data.conf; //获取金兵数量
    //获取user数据 
	db.get_user_data(account,function(data){
        //如果数据为空 系统错误
        if(data == null){
			http.send(res,1,"system error");
			return;
        } 
        //获取用户id name
		var userId = data.userid; 
		var name = data.name;
		//验证玩家状态
		db.get_room_id_of_user(userId,function(roomId){
			if(roomId != null){
				http.send(res,-1,"user is playing in room now.");
				return;
			}
			//创建房间
			room_service.createRoom(account,userId,conf,function(err,roomId){
				if(err == 0 && roomId != null){
                    //进入房间
					room_service.enterRoom(userId,name,roomId,function(errcode,enterInfo){
						if(enterInfo){
							var ret = {
								roomid:roomId,
								ip:enterInfo.ip,
								port:enterInfo.port,
								token:enterInfo.token,
								time:Date.now()
							};
							ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
							http.send(res,0,"ok",ret);
						}
						else{
							http.send(res,errcode,"room doesn't exist.");
						}
					});
				}
				else{
					http.send(res,err,"create failed.");					
				}
			});
		});
	});
});


//进入房间
app.get('/enter_private_room',function(req,res){
	var data = req.query;
    var roomId = data.roomid;
    //判断房间id是否存在
	if(roomId == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
    }
    //判断账号是否是否不为空
	if(!check_account(req,res)){
		return;
	}
    //获取数据
	var account = data.account;
    //获取数据
	db.get_user_data(account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		var userId = data.userid;
		var name = data.name;

		//验证玩家状态
		//todo
		//进入房间
		room_service.enterRoom(userId,name,roomId,function(errcode,enterInfo){
			if(enterInfo){
				var ret = {
					roomid:roomId,
					ip:enterInfo.ip,
					port:enterInfo.port,
					token:enterInfo.token,
					time:Date.now()
				};
				ret.sign = crypto.md5(roomId + ret.token + ret.time + config.ROOM_PRI_KEY);
				http.send(res,0,"ok",ret);
			}
			else{
				http.send(res,errcode,"enter room failed.");
			}
		});
	});
});

//获取历史记录
app.get('/get_history_list',function(req,res){
    var data = req.query; //数据合法性
    //账号合法性
	if(!check_account(req,res)){
		return;
    }
    //获取用户信息
	var account = data.account;
	db.get_user_data(account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
        var userId = data.userid;
        //数据库查询历史记录
		db.get_user_history(userId,function(history){
			http.send(res,0,"ok",{history:history});
		});
	});
});
//获取在哪个房间game
app.get('/get_games_of_room',function(req,res){
	var data = req.query;
    var uuid = data.uuid;
    //获取uuid
	if(uuid == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
    }
    //账号合法性
	if(!check_account(req,res)){
		return;
    }
    //数据库查询
	db.get_games_of_room(uuid,function(data){
		console.log(data);
		http.send(res,0,"ok",{data:data});
	});
});

//获取游戏细节
app.get('/get_detail_of_game',function(req,res){
	var data = req.query;
	var uuid = data.uuid;
    var index = data.index;
    //判断是否为空
	if(uuid == null || index == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
    }
    //验证账号合法性
	if(!check_account(req,res)){
		return;
    }
    //数据库获取细节
	db.get_detail_of_game(uuid,index,function(data){
		http.send(res,0,"ok",{data:data});
	});
});

//获取房卡状态
app.get('/get_user_status',function(req,res){
    //账号合法性
	if(!check_account(req,res)){
		return;
    }
    //获取房卡数量
	var account = req.query.account;
	db.get_gems(account,function(data){
		if(data != null){
			http.send(res,0,"ok",{gems:data.gems});	
		}
		else{
			http.send(res,1,"get gems failed.");
		}
	});
});

//获的notcie信息
app.get('/get_message',function(req,res){
	if(!check_account(req,res)){
		return;
    }
    //type
	var type = req.query.type;
	
	if(type == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	//版本
    var version = req.query.version;
    //获取类型
	db.get_message(type,version,function(data){
		if(data != null){
			http.send(res,0,"ok",{msg:data.msg,version:data.version});	
		}
		else{
			http.send(res,1,"get message failed.");
		}
	});
});

//判断是否在线
app.get('/is_server_online',function(req,res){
	if(!check_account(req,res)){
		return;
    }
    //ip 端口
	var ip = req.query.ip;
    var port = req.query.port;
    //是否在线
	room_service.isServerOnline(ip,port,function(isonline){
		var ret = {
			isonline:isonline
		};
		http.send(res,0,"ok",ret);
	}); 
});

//初始化监听
exports.start = function($config){
	config = $config;
	app.listen(config.CLEINT_PORT);
	console.log("client service is listening on port " + config.CLEINT_PORT);
};