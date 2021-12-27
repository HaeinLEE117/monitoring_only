var pool = require('./db_connect');
 
module.exports = function (sql) {
  return {
    select: function(callback){
      pool.getConnection(function(err, con){
  
        con.query(sql, function (err, result, fields) {
          con.release();
          if (err) return callback(err);
          callback(null, result);
        });
      });
    },
    pool: pool
  }
};