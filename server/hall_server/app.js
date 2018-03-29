var client_service = require("./client_service");
var room_service = require("./room_service");

var configs = require('../configs_local.js');
var config = configs.hall_server();

var db = require('../utils/db');
db.init(configs.mysql());

client_service.start(config);
room_service.start(config);