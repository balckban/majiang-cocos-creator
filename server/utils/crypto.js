var crypto = require('crypto');

exports.md5 = function (content) {
	var md5 = crypto.createHash('md5');
	md5.update(content);
	return md5.digest('hex');	
}

exports.toBase64 = function(content){
	return new Buffer(content).toString('base64');
}

exports.fromBase64 = function(content){
	return new Buffer(content, 'base64').toString();
}
