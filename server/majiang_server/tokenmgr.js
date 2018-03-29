var crypto = require("../utils/crypto");

var tokens = {};
var users = {};

exports.createToken = function(userId,lifeTime){
	var token = users[userId];
	if(token != null){
		this.delToken(token);
	}

	var time = Date.now();
	token = crypto.md5(userId + "!@#$%^&" + time);
	tokens[token] = {
		userId: userId,
		time: time,
		lifeTime: lifeTime
	};
	users[userId] = token;
	return token;
};

exports.getToken = function(userId){
	return users[userId];
};

exports.getUserID = function(token){
	return tokens[token].userId;
};

exports.isTokenValid = function(token){
	var info = tokens[token];
	if(info == null){
		return false;
	}
	if(info.time + info.lifetime < Date.now()){
		return false;
	}
	return true;
};

exports.delToken = function(token){
	var info = tokens[token];
	if(info != null){
		tokens[token] = null;
		users[info.userId] = null;
	}
};