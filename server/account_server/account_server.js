var crypto = require('../utils/crypto'); //加密
var express = require('express'); 
var db = require('../utils/db');//数据库管理
var http = require("../utils/http");//http管理工具

//应用级中间件绑定到 app 对象 使用
var app=express();
var hallAddr="";

//将值转成json并发送
function send(res,ret){
    var str=JSON.stringify(ret)
    res.send(str)
}

var config =null;

//提供开启监听接口
exports.start =function(cfg){
    config = cfg;
    //ip端口拼接
	hallAddr = config.HALL_IP  + ":" + config.HALL_CLIENT_PORT;
    //开启端口监听
    app.listen(config.CLIENT_PORT);
	console.log("account server is listening on " + config.CLIENT_PORT);
}

//设置跨域访问
app.all('*',function(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();//将控制权交给栈中下一个中间件
});

//检查游戏端是否最新请求
app.get('/get_version',function(req,res){
    var ret={
        version:config.VERSION,
    }
   send(res,ret);  //发送版本
});

//获取服务器信息
app.get('/get_serverinfo',function(req,res){
	var ret = {
		version:config.VERSION,
		hall:hallAddr,
		appweb:config.APP_WEB,
	}
	send(res,ret);
});

//游客登入接口 注册接口
app.get('/guest',function(req,res){
	var account = "guest_" + req.query.account;   //接收账号
    var sign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY); //转换成md5
	var ret = {
		errcode:0,
		errmsg:"ok",
		account:account,
		halladdr:hallAddr,
		sign:sign
	}
	send(res,ret);
});


//注册get请求  /register
app.get('/register',function(req,res){
    var account=req.query.account; 
    var password=req.query.password;//接受请求账号密码
    //请求失败
    var fnFailed=function(){
       send(res,{errcode:1,errmsg:"account has been used."}); 
    };
    //注册成功
    var fnSucceed=function(){
        send(res,{errcode:0,errmsg:"ok"});//返回请求成功json
    };

    //数据库查询是否存在用户
    db.is_account_exist(account,function(exist){
        if(exist){
            //账号创建入库
           db.create_account(account,password,function(ret){
            if(ret){
                fnSucceed();
            }else{
                fnFailed();
            }

           });
       }else{
           fnFailed();
       }

    });
});

//获取account信息接口
app.get('/auth',function(req,res){
   var account=req.query.account;
   var password=req.query.password;
   //数据库获取用户信息
   db.get_account_info(account,password,function(info){
    //如果信息等于空    
    if(info=null){
        send(res,{errcode:1,errmsg:"invalid account"});
        return;
    }
      
      var account="vivi_"+req.query.account;
      var sign = get_md5(account + req.ip + config.ACCOUNT_PRI_KEY);
      var ret = {
          errcode:0,
          errmsg:"ok",
          account:account,
          sign:sign
      }
      send(res,ret);
   });
});




