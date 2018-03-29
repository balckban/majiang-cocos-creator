var account = "18081177883";
var password = 123456;

var sql = ' SELECT * FROM t_admins WHERE account = "' + account + '" AND password = PASSWORD("' + password + '")';
console.log(sql);
