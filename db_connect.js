var mysql = require('mysql');
 
module.exports = function () {
    var pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '1234',
        database: 'agv_monitor',
    });
 
  return {
    getConnection: function (callback) {    // connection pool을 생성하여 리턴합니다
      pool.getConnection(callback);
    },
    end: function(callback){
      pool.end(callback);
    }
  }
}();
