var mysql = require('mysql');
var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'qq1314',
    database:'qqq',
    port: 3306
});
conn.connect();
conn.query('SELECT * FROM  t_accounts', function(err, rows, fields) {
    if (err) throw err;
    console.log('The solution is: ', rows);
});
conn.end();
