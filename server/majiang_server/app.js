var http_service = require("./http_service");
var socket_service = require("./socket_service");

//从配置文件获取服务器信息
var configs = require('../configs_local.js');
var config = configs.game_server();

var db = require('../utils/db');
db.init(configs.mysql());

//开启HTTP服务
http_service.start(config);

//开启外网SOCKET服务
socket_service.start(config);

//require('./gamemgr');
