var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'meta_0'
});
connection.connect();

module.exports = {
  HTML:function(list,  authStatusUI = '<a href = "/logout_process">logout<a>'){
    return `
    <!doctype html>
    <html>
    <head>
      <title>SW-Meta</title>
      <meta charset="utf-8">
    </head>
    <body>
    ${authStatusUI}
      <h1>MAIN</h1>
      ${list}
    </body>
    </html>
    `;
  },list:function(){
    var list = '<ul>';
    list = list + `<li><a href="/F1">1층</a></li>`;
    list = list + `<li><a href="/F2">2층</a></li>`;
    list = list + `<li><a href="/F3">3층</a></li>`;
    list = list + '</ul>';
    list = list + `<h1>AGV Control Programm</h1><ul>`;
    for(var i = 1; i<12; i++){
      list = list + `<li><a href="/AGV_control/${i}">${i}호기</a></li>`;
    }
    list = list + '</ul>';
    return list;
  },meta:function(floor){
    let equm = new Array("pattern3", "pattern4", "pattern1", "AO1", "TS","welding10","welding11",
    "welding6","measurement8", "measurement9");
    let left = new Array(522,552,856,186,191,810,1010,1783,1566,1566,1342);
    let top = new Array(1749,1949,1545,1625,1925,1149,1049,1538,1748,1748);

    var html =`
    <HTML lang="ko">
    <HEAD>
    <link rel="stylesheet" href="css/style2_2.css" />
    </HEAD>
    <BODY>
    <div class="floor_1">`;

    for(i in equm){
      var State = `off.png`;
      connection.query(`select State,User,Time from ${equm[i]}_now ORDER BY Time desc limit 1`, 
      function (error, results, fields){
        console.log(results[0]);
        if(results[0].State !=null){
          State = `on.gif`;
        }
      });
      html = html +`
      <div class="popup" style="cursor: pointer; left: ${left[i]}px; top:${top[i]}px"
      onclick="window.open('/state/${equm[i]}', 'window_name'
 , 'width=430,height=500,location=no,status=no,scrollbars=yes');">${equm[i]}</div>
 <div class="state_box" style="left:${left[i]}px; top:${top[i]+50}px;"><img src="src/${State}" style="margin-right:3px;" />
       분 경과..</div>
      `;
    }
    
    html = html +
    `
    <script>
    document.getElementById('hello').style.visibility="hidden";
    </script>
    </BODY>
    </HTML>
    `;
    return html;
  }
}
