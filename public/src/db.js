
var mysql = require('./mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '1234',
  database : 'agv_monitor'
});
  
connection.connect();
  
connection.query('select Time,PointNumber,Destination from agvlocation1 ORDER BY Time desc limit 1', function (error, results, fields) {
    if (error) {
        console.log(error);
    }
    console.log(results[0].PointNumber);
});
  
connection.end();

function set_car1(){
  var car1 = document.getElementById('car1').style.left="1000px";
}
