
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  connection.connect();

let line2_X = new Array(400, 400, 400, 460, 551, 651, 751, 851, 951, 1051, 1151, 1251, 1351, 1451, 1551, 
    1641, 1641, 1741, 1841, 1941, 2041, 2161,2281, 2371,2371,2371,2371,2421,2521);
let line2_Y = new Array(1600, 1500, 1400, 1320, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 
    1250, 1170, 1170, 1170, 1170, 1170, 1170,1170,1120,1020,920,820,730,730);

let seq = new Array(406,405,404,403,402,401,
    311,310,309,308,307,306,305,304,303,302,301,
    205,204,203,202,201,
    107,106,105,104,103,102,101);



    for(var i = 0; i < 29; i++){
    var sql = `insert into PointInfo1000(seq,ScaleX,ScaleY) values (${seq[i]}, ${line2_X[i]}, ${line2_Y[i]})`;
    connection.query(sql,
    function (error, results, fields) {
        
    });
    }
