const mysql = require('mysql');
var pool = mysql.createPool({
    host: 'localhost',
    connectionLimit : 100,
    user: 'root',
    password: '1234',
    database: 'agv_monitor',
    debug    : false 
});

function executeQuery(query, callback) {
    pool.getConnection(function (err, connection) {
      if (err) {
          return callback(err, null);
      }
      else if (connection) {
          connection.query(query, function (err, rows, fields) {
              connection.release();
              if (err) {
                  return callback(err, null);
              }
              return callback(null, rows);
          })
      }
      else {
          return callback(true, "No Connection");
      }
    });
  }
  
  
  function getResult(query,callback) {
    executeQuery(query, function (err, rows) {
       if (!err) {
          callback(null,rows);
       }
       else {
          callback(true,err);
       }
    });
  }
  
  function getServers() {
    getResult("select * from agvs_info",function(err,rows){
      if(!err){
          return rows;
      }else{
          console.log(err);
      }
    });   
  }
  
  module.exports = getResult;