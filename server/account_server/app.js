var db = require('../utils/db');
var configs = require('../configs.js');

//init db pool.
db.init(configs.mysql());

var config = configs.account_server();
var as = require('./account_server');
as.start(config);

var dapi = require('./dealer_api');
dapi.start(config);