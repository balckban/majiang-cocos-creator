var http = require('http');
var https = require('https');
var qs = require('querystring');

//扩展String.prototype.format 字符串拼接的功能
String.prototype.format=function(args){
var result = this;
//调用的实际参数的个数是否大于0
if (arguments.length > 0) {
  if (arguments.length == 1 && typeof (args) == "object") {
    for (var key in args) {
      if(args[key]!=undefined){
        var reg = new RegExp("({" + key + "})", "g");
        result = result.replace(reg, args[key]);
      }
    }
  }
  else {
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] != undefined) {
        //var reg = new RegExp("({[" + i + "]})", "g");
        var reg = new RegExp("({)" + i + "(})", "g");
        result = result.replace(reg, arguments[i]);
      }
    }
  }
}
return result;
};

// post请求
exports.post = function (host,port,path,data,callback) {
  var content = qs.stringify(data);
  var options = {
     hostname: host,
     port: port,
     path: path + '?' + content,
     method:'GET'
};

var req = http.request(options, function (res) {
   console.log('STATUS: ' + res.statusCode);
   console.log('HEADERS: ' + JSON.stringify(res.headers));
   res.setEncoding('utf8');
   res.on('data', function (chunk) {
    //console.log('BODY: ' + chunk);
    callback(chunk);
  });
});

req.on('error', function (e) {
  console.log('problem with request: ' + e.message);
});

req.end();
};

exports.get2 = function (url,data,callback,safe) {
var content = qs.stringify(data);
var url = url + '?' + content;
var proto = http;
if(safe){
  proto = https;
}
var req = proto.get(url, function (res) {
  //console.log('STATUS: ' + res.statusCode);
  //console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    //console.log('BODY: ' + chunk);
    var json = JSON.parse(chunk);
    callback(true,json);
  });
});

req.on('error', function (e) {
  console.log('problem with request: ' + e.message);
  callback(false,e);
});

req.end();
};

exports.get = function (host,port,path,data,callback,safe) {
var content = qs.stringify(data);
var options = {
  hostname: host,
  path: path + '?' + content,
  method:'GET'
};
if(port){
  options.port = port;
}
var proto = http;
if(safe){
  proto = https;
}
var req = proto.request(options, function (res) {
  //console.log('STATUS: ' + res.statusCode);
  //console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    //console.log('BODY: ' + chunk);
    var json = JSON.parse(chunk);
    callback(true,json);
  });
});

req.on('error', function (e) {
  console.log('problem with request: ' + e.message);
  callback(false,e);
});

req.end();
};

exports.send = function(res,errcode,errmsg,data){
if(data == null){
  data = {};
}
data.errcode = errcode;
data.errmsg = errmsg;
var jsonstr = JSON.stringify(data);
res.send(jsonstr);
};
