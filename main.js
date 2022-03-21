var express = require('express')
var app = express()
var fs = require('fs');
var path = require('path');
var qs = require('querystring');
var bodyParser = require('body-parser');
var sanitizeHtml = require('sanitize-html');
var template = require('./lib/template.js');
var db_template = require('./lib/db_template.js');
const getResult = require('./lib/db');
var mysql = require('mysql');
const { type } = require('os');
var sql = require('./db_sql')();
const lineReader = require('line-reader');
var cookie = require('cookie');
var JSAlert = require("js-alert");
var bcrypt = require('bcrypt-nodejs'); 

const db_info = {
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'meta_0'
};

//쿠키를 확인해서 로그인이 되어있는지 확인하는 함수
function authIsOwner(request, response){
  var cookies = {};
  var connection4 = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'meta_0'
  });
  if(request.headers.cookie){
  cookies = cookie.parse(request.headers.cookie);
      var querystring = `select password_encrypted from enc_user`;
      //데이터베이스에서 가져온 암호화횐 비밀번호 중 현재 쿠키와 일치하는 비밀번호가 있으면 로그인 된 것으로 처리.
    connection4.query(querystring,
    function (error, results, fields) {
      for (i in results) {
        if (cookies.password === results[i].password_encrypted){ 
          return true;
        }
      }
      return false;
    });
  }else{
    return false;
  }
  }

//로그인, 로그아웃 버튼UI
function authStatusUI(request, response){
  var authStatusUI = `<a href = "/login">login<a>`;
  if(authIsOwner(request, response)){
    authStatusUI = `<a href = "/logout_process">logout<a>`;
  }
  return authStatusUI;
}

//정적 파일 디렉토리 지정
app.use(express.static('public'));
app.use(express.static(__dirname + '/public'));

//미들웨어 작성 예제
app.use(bodyParser.urlencoded({ extended: false }));
app.get('*', function (request, response, next) {
  var isOwner = authIsOwner(request,response);
  request.authStatusUI = authStatusUI;
  //get으로 접속하는 모든 페이지에 ./data에 존재하는 filelist를 request.list에 담아 보냄
  fs.readdir('./data', function (error, filelist) {
    request.list = filelist;
    next(); 
  });
});
app.get('/state/*', function (request, response, next) {
  fs.readdir('./equm_state', function (error, filelist) {
    request.list = filelist;
    next();
  });
});

//route, routing 메인페이지
app.get('/', function (request, response) {
  if(authIsOwner(request,response) === false){
    response.send("<script>alert('로그인 필요');location.href='/login';</script>");
    return false;
  }

  var list = template.list();
  var html = template.HTML(list
  );
  response.send(html);
});


//회원가입페이지
app.get('/join', function (request, response) {
  var title = 'join';
  var list =  template.list();
  var html = 
    `<h1>User 입력</h1>
    <HEAD>
    <link rel="stylesheet" href="css/style2_2.css" />
    </HEAD>
    <div class="container">
    <form action = "join_process" method = "post">
    <p> <label for="id">ID: </label><input type = "text" name="id" placeholder="영문+숫자만 입력"></p>
    <p><label for="password">password: </label><input type = "password" name="password" placeholder="영문+숫자만 입력"></p>
    <p><label for="name">name: </label><input type = "text" name="name" placeholder="영문+숫자만 입력"></p>
    <p><label for="admin_code">관리자번호 입력: </label><input type = "password" name="admin_code" placeholder="admin_code"></p>
    <p><input type = "submit"></p>
    </form></div>`
  ;
  response.send(html);
});
//회원가입 처리 
app.post('/join_process', function (request, response) {
  var post = request.body;
  if(post.admin_code == '950122'){
    var connection4 = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: 'meta_0'
    });
    // array 사용해서 장비 상태 가져오기
    connection4.connect();
    bcrypt.hash(post.password, null, null, function(err, hash){ 
    var querystring = `insert into enc_user(userid,password_encrypted,name) values("${post.id}","${hash}","${post.name}")`;
    connection4.query(querystring,
      function (err, result, field) {
        if(err){
          response.send("<script>alert('가입 오류');location.href='/login';</script>");
          response.end();
        }else{
          response.send("<script>alert('입력 완료');location.href='/login';</script>");
        response.end();
        }
      });
  });
  }else{
    response.send("<script>alert('관리자 번호 입력 오류');location.href='/login';</script>");
  }
});

//로그인 페이지
app.get('/login', function (request, response) {
  var title = 'login';
  var list =  template.list();
  var html = 
    `<form action = "login_process" method = "post">
    <h1>LOG IN</h1>
    <p><input type = "text" name="email" placeholder="id"></p>
    <p><input type = "password" name="password" placeholder="password"></p>
    <p><input type = "submit"></p>
    </form>
    <a href="/join">User 입력</a>`
  ;
  response.send(html);
});
//로그인 처리
app.post('/login_process', function (request, response) {
  var post = request.body;
  var id_check = false;
      var connection4 = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: 'meta_0'
    });
  var querystring = `select userid from enc_user`;
  connection4.query(querystring,
  function (error, results, fields) {
    for (i in results) {
      if (results[i].userid == post.email){
        var querystring2 = `select * from enc_user where userid = '${post.email}'`;
        connection4.query(querystring2,
          function (error, results, fields) {
            if(error){
            response.send("<script>alert('log_in_error');location.href='/login';</script>");
            response.end();
          }
          else{
            if(bcrypt.compareSync(post.password,results[0].password_encrypted)){
              response.writeHead(302, { 
                'Set-Cookie': [
                  `email=${post.email}; max-age=3600`,
                  `password = ${results[0].password_encrypted}; max-age=3600`
              ],
                Location: `/` });
                response.end();
            }
          }
          });
      }
    }
    
  });
});
//로그아웃 처리 : 쿠키 해제
app.get('/logout_process', function (request, response) {
  var post = request.body;
      response.writeHead(302, { 
        'Set-Cookie': [
          `email=; Max-Age=0`,
          `password =; Max-Age=0 `,
          `nickname =; Max-Age=0`
      ],
        Location: `/` });
        response.end();
});



//---------------------------------------------------------------------------

app.get('/F1', function (request, response) {
  if(authIsOwner(request,response) === false){
    response.send("<script>alert('로그인 필요');location.href='/login';</script>");
    return false;
  }
  let product = new Array;
  let line_color = new Array;
  let visibility = new Array;
  let direction = new Array;
  let time = new Array;
  let position = new Array;
  let destination = new Array;
  let ScaleX = new Array;
  let ScaleY = new Array;
  let equm = new Array("pattern3", "pattern4", "pattern1", "AO1", "TS", "welding10", "welding11",
    "welding6", "measurement8", "measurement9",
    "external5", "measurement10", "measurement1", "measurement2",
    "measurement6", "external3",
    "welding5","welding1","welding4","measurement3","measurement4",
    "3D_scanner");

  let today = new Date();
  let user = new Array;
  let working = new Array;
  let working_time = new Array;
  let state = new Array;
  let color = new Array('#a5a5a5', '#d4cd00', '#3369d4', '#6f04b0');
  let vehicle_running = new Array;


  get_AGV_infos(product, time, position, destination, vehicle_running, direction,today,ScaleX,ScaleY);

  get_equipment_infos(equm, today, working_time, state, working, user);


  var html = ``;

  setTimeout(() => {
//    console.log(product);
    for (var i = 0; i < 4; i++) {
//1층이 아닌 장소에 있는 agv는 2, 3 층 버튼 밑에 위치하도록 
      if ((parseInt(position[i]) / 1000) > 2) {
        ScaleX[i] =(420);
        ScaleY[i] = (68 +  i * 30);
      } else if ((parseInt(position[i]) / 1000) > 1) {
        ScaleX[i]=(247);
        ScaleY[i]=(88 +  i * 30);
      }
      if (vehicle_running[i] === "#02c706") {
        line_color[return_line(destination[i])] = color[i];
      }
    }
    
    html = db_template.meta(ScaleX, ScaleY, time, product, destination, direction, position, equm,
      working, state, working_time, user, line_color, vehicle_running);
  }, 300);

  setTimeout(() => {
    response.send(html);
  }, 500);

});

//------------------------------3층 코드-------------------------------

app.get('/F3', function (request, response) {
  if(authIsOwner(request,response) === false){
    response.send("<script>alert('로그인 필요');location.href='/login';</script>");
    return false;
  }
  let product = new Array;
  let line_color = new Array;
  let visibility = new Array;
  let direction = new Array;
  let time = new Array;
  let position = new Array;
  let destination = new Array;
  let ScaleX = new Array;
  let ScaleY = new Array;
  let equm = new Array("welding9","welding8","measurement11","coating1","coating2","coating3","pre_pattern2");

  let today = new Date();
  let user = new Array;
  let working = new Array;
  let working_time = new Array;
  let state = new Array;
  let color = new Array('#a5a5a5', '#d4cd00', '#3369d4', '#6f04b0');
  let vehicle_running = new Array;

  get_AGV_infos(product, time, position, destination, vehicle_running, direction,today,ScaleX,ScaleY);

  get_equipment_infos(equm, today, working_time, state, working, user);


  var html = ``;

  setTimeout(() => {
    for (var i = 0; i < 4; i++) {
//3층이 아닌 장소에 있는 agv는 1,2층 버튼 밑에 위치하도록 
      if ((parseInt(position[i]) / 1000) < 1) {
        ScaleX[i] = 85;
        ScaleY[i] = (68 + i * 30);
      } else if ((parseInt(position[i]) / 1000) < 2) {
        ScaleX[i] = 219;
        ScaleY[i] = (88 + i *30);
      }
      if (vehicle_running[i] === "#02c706") {
        line_color[return_line(destination[i])] = color[i];
      }
    }
    html = db_template.floor_3(ScaleX, ScaleY, time, product, destination, direction, position, equm,
      working, state, working_time, user, line_color, vehicle_running);
  }, 300);

  setTimeout(() => {
    response.send(html);
  }, 500);

});



//apllication port 3003
app.listen(3003, function () {
  console.log('Example app listening on port 3003!')
});



//임시 2층
app.get('/F2', function (request, response) {
  if(authIsOwner(request,response) === false){
    response.send("<script>alert('로그인 필요');location.href='/login';</script>");
    return false;
  }
  let product = new Array;
  let line_color = new Array;
  let visibility = new Array;
  let direction = new Array;
  let time = new Array;
  let position = new Array;
  let destination = new Array;
  let ScaleX = new Array;
  let ScaleY = new Array;
  let equm = new Array("welding8","welding9","measurement11","coating1","coating2","coating3");

  let today = new Date();
  let user = new Array;
  let working = new Array;
  let working_time = new Array;
  let state = new Array;
  let color = new Array('#a5a5a5', '#d4cd00', '#3369d4', '#6f04b0');
  let vehicle_running = new Array;


  get_AGV_infos(product, time, position, destination, vehicle_running, direction,today,ScaleX,ScaleY);

  get_equipment_infos(equm, today, working_time, state, working, user);


  var html = ``;

  setTimeout(() => {
    for (var i = 0; i < 4; i++) {
//3층이 아닌 장소에 있는 agv는 1,2층 버튼 밑에 위치하도록 
      if ((parseInt(position[i]) / 1000) < 1) {
        ScaleX[i] = 85;
        ScaleY[i] = (68 + i * 30);
      } else if ((parseInt(position[i]) / 1000) > 2) {
        ScaleX[i] = 419;
        ScaleY[i] = (88 + i *30);
      }
      if (vehicle_running[i] === "#02c706") {
        line_color[return_line(destination[i])] = color[i];
      }
    }
    html = db_template.floor_2(ScaleX, ScaleY, time, product, destination, direction, position, equm,
      working, state, working_time, user, line_color, vehicle_running);
  }, 300);

  setTimeout(() => {
    response.send(html);
  }, 500);

});


//장비 상태를 입력받는 페이지 코드. state파일에 장비유형 별 state정리
app.get('/state/:equmId', function (request, response) {
  var filteredId = path.parse(request.params.equmId).base;
  const file_name = filteredId[0] + filteredId[1];
//측정 및 검사기는 입력 단계가 많아 따로 처리
  if (file_name == 'me') {
    fs.readFile(`./equm_state/${file_name}.txt`, 'utf8', function (err, equm_state) {
      var title = request.params.pageId;
      var sanitizedTitle = sanitizeHtml(filteredId);
      var strArray = equm_state.split('\n');
      var html = db_template.me_state_list(filteredId, strArray);
      response.send(html);
    })
  } else {
    fs.readFile(`./equm_state/${file_name}.txt`, 'utf8', function (err, equm_state) {
      var title = request.params.pageId;
      var sanitizedTitle = sanitizeHtml(filteredId);
      var strArray = equm_state.split('\n');
      var html = db_template.state_list(filteredId, strArray);
      response.send(html);
    })
  }
});
//장비 상태 업데이트 처리하는 코드
app.post('/submit', function (request, response) {
  var post = request.body;
  var equm = post.equm;
  var input_state = post.equm_state;
  var input_user = post.user_number;
  var html = ``;
  var connection = mysql.createConnection(db_info);
  connection.connect();
  var sql = `select User from ${equm}_now ORDER BY seq desc`;
  connection.query(sql,
    function (error, results, fields) {
      if (results[0].User == null) {
        if (input_state != '') {
          connection.query(`insert into ${equm}_now(State,User, Time) VALUES("${input_state}", ${input_user}, now())`,
            function (error, results, fields) {
              html = html + `장비 업데이트 완료`;
            });
        } else {
          html = html + `이미 작업이 종료된 장비`;
        }
      } else {
        if (results[0].User == input_user) {
          if (input_state == '') {
            connection.query(`insert into ${equm}_now(Time) VALUES(now())`,
              function (error, results, fields) {
                html = html + `장비 종료 완료`;
              });
          } else {
            connection.query(`insert into ${equm}_now(State,User, Time) VALUES("${input_state}", ${input_user}, now())`,
              function (error, results, fields) {
                html = html + `장비 업데이트 완료`;
              });
          }
        } else {
          html = html + `이미 작업 중인 장비`;
        }

      }
      setTimeout(() => {
        html = html + `</br><input type="button" value="닫기" onClick="window.close()">`;
        response.send(html);
      }, 500);
    })


});
//AGV 클릭시 해당 호기의 정보를 보여주는 페이지
app.get('/AGV_DATA/:AGVnumber', function (request, response) {
  var number = path.parse(request.params.AGVnumber).base;
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  var html = db_template.AGV_info(number);
  connection.connect();
  connection.query(`SELECT PointNumber,Destination,time FROM agvlocation${number} ORDER BY time DESC`,
  function (error, results, fields) {
    for(i in results){
      html = html + `<tr align=\"center\"><td>${results[i].PointNumber}</td>
      <td>${results[i].Destination}</td>
      <td>${results[i].time.toLocaleString()}</td></tr>`;
    }
    html = html +`</tr></table>  </BODY>  </HTML>
`;
response.send(html);

});
});


//오류 기록(데이터베이스)를 보여주는 페이지
app.get('/error_log/AGV', function (request, response) {
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  var html = db_template.log_info();
  connection.connect();
  connection.query(`SELECT * FROM error_log ORDER BY time DESC`,
  function (error, results, fields) {
    // tmp = results[0].time("m.d.y");
    // console.log(results[0].time.toLocaleString());
    for(i in results){
      html = html + `<tr align=\"center\"><td>${results[i].code}</td>
      <td>${results[i].message}</td>
      <td>${results[i].time.toLocaleString()}</td></tr>`;
    }
    html = html +`</tr></table>  </BODY>  </HTML>
`;
response.send(html);

});
});



// proceed input from AGV
// AGV에서 보내는 정보를 DB에 처리하는 부분 API1
app.get('/AGV/:VN/:point/:des/:pro', async (req, res) => {
  var fail_res = {message:'0'};
  var ok_res = {message : '1 ok'};
  
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  connection.connect();
  sql = `insert into agvlocation${req.params.VN} 
  (PointNumber, Destination, Time)
  VALUES (${req.params.point}, ${req.params.des}, 
  now())`;
  connection.query(sql, (err, result) => {
    if (err) {
      console.log(sql);
      res.json(fail_res);
    }else{
    sql = `update agvs_info set Product = ${req.params.pro} 
    WHERE VehicleNumber = ${req.params.VN}`;
    connection.query(sql, (err, result) => {
      if (err) {
        console.log('wrong isnert');
        res.send('failed...');
      }
      res.json(ok_res);
    });
  }
    connection.end();
  });
});

// proceed input from equipment
// 장비에서 보내는 정보를 DB에 처리하는 부분 API2-1 (장비상태)
app.get('/equipment/:equ_name/:process', async (req, res) => {
  var fail_res = {message:'False'};
  var ok_res = {message : 'True'};
  
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'now_state'
  });
  connection.connect();

  var sql = `insert into ${req.params.equ_name}(State, Time) VALUES ("${req.params.process}", now())`;
  console.log(sql);
 
  
  connection.query(sql, (err, result) => {
    if (err) {
      console.log("something wrong");
      res.json(fail_res);
    }else{
      res.json(ok_res);
  }
    connection.end();
  });
});

// CIM에서 보내는 정보를 DB에 처리하는 부분 API2 - 수주번호 등 제품정보
app.get('/OrderNumber/:equ_name/:order_no', async (req, res) => {
  var fail_res = {message:'False'};
  var ok_res = {message : 'True'};
  
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'order_no'
  });
  connection.connect();

  var sql = `insert into ${req.params.equ_name}(Order_No, Time) VALUES ("${req.params.order_no}", now())`;
  console.log(sql);
 
  
  connection.query(sql, (err, result) => {
    if (err) {
      console.log("something wrong");
      res.json(fail_res);
    }else{
      res.json(ok_res);
  }
    connection.end();
  });
});



// proceed input from washer
// 세척기에서 보내는 정보를 DB에 처리하는 부분 API3
app.get('/washer_input/:equ_name/:process/:order_no', async (req, res) => {
  var fail_res = {message:'failed'};
  var ok_res = {message : 'query ok'};
  
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'meta_0'
  });
  connection.connect();

  sql = `insert into ${req.params.equ_name}_status 
  (State, Order_Np, Time)
  VALUES (${req.params.point}, ${req.params.des}, 
  now())`;
  connection.query(sql, (err, result) => {
    if (err) {
      console.log("something wrong");
      res.json(fail_res);
    }else{
    sql = `update agvs_info set Product = ${req.params.pro} 
    WHERE VehicleNumber = ${req.params.VN}`;
    connection.query(sql, (err, result) => {
      if (err) {
        console.log('wrong isnert');
        res.send('failed...');
      }
      res.json(ok_res);
    });
  }
    connection.end();
  });
});

  //목적지를 보고 line 색상을 결정해주는 함수
function return_line(destination) {
    switch (destination) {
      case "306":
      case "1102":
        return 1;
        break;
      case "101":
      case "406":
        return 2;
        break;
      case "307":
      case "2101":
        return 3;
        break;
      case "14":
        return 4;
        break;
      default:
        return 0;
    }
  }

  //차량 주행 정보를 가져오는 함수
function get_AGV_infos(product, time, position, destination, vehicle_running, direction,today,ScaleX,ScaleY){
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  connection.connect();

  //SQL문 1번 AGBS_Info 테이블에서 통합정보 제품 운반여부, 차체색상을 가져온다. => product[]
  connection.query(`select * from agvs_info ORDER BY VehicleNumber asc`,
    function (error, results, fields) {
      for (i in results) {
        if (results[i].product) {
          product.push("initial");
        } else {
          product.push("hidden");
        }
      }
    });

  //        SQL문 2번:: 각 agv 호기 테이블에서 시간, 방향, 마지막위치, 목적지(주행여부)를 가져옴
  //            time[] -> 마지막으로 데이터베이스에 insert된 시간
  //            position[] -> 현재 agv 위치
  //            destination[] -> agv의 목적지. 주행중이 아니라면 0
  for (var i = 0; i < 4; i++) {
    connection.query(`select Time,PointNumber,Destination from agvlocation? ORDER BY Time desc limit 1`, [i + 1],
      function (error, result, fields) {
        //        DB에서 목적지, 마지막 위치, 입력 시간을 가져온 후에
        time.push(result[0].Time);
        position.push(result[0].PointNumber);
        destination.push(result[0].Destination);
        //        프로그램 화면상에 agv 주행 정보를 판단해서 띄워줌
        if (result[0].Destination < 0) {
          vehicle_running.push('yellow');
          direction.push("blank.png");
        } else if (result[0].Destination > 0 && result[0].Time) {
          var r = today - result[0].Time;
          if ((r / 6000) > 80) {    //시간 초과라면 오류 표시(일정 시간이상 같은자리에 있었음을 의미)
            vehicle_running.push('yellow');
            direction.push("blank.png");
          } else {    //정상 주행인 경우: 상태등 초록, 위아래 좌우 판단해서 화살표 표출
            vehicle_running.push("#02c706");
            if ((parseInt(result[0].Destination) - parseInt(result[0].PointNumber)) >= 500) {
              direction.push("up.gif");
            } else if ((parseInt(result[0].Destination) - parseInt(result[0].PointNumber)) <= -500) {
              direction.push("down.gif");
            }
            else {
              if (parseInt(result[0].Destination) - parseInt(result[0].PointNumber) > 0) {
                direction.push("left.gif");
              }
              else {
                direction.push("right.gif");
              }
            }

          }
        } else {  //정지(대기): 빨강
          vehicle_running.push('red');
          direction.push("blank.png");
        }
 
          var connection2 = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'agv_monitor'
          });
          
          connection2.query(`select ScaleX,ScaleY from PointInfo1000 where seq=${parseInt(result[0].PointNumber)}`,
            function (error, results, fields) {
              ScaleX.push(results[0].ScaleX);
              ScaleY.push(results[0].ScaleY);
            });
       
      });
  }
  }

  //층 별 장비 상태 정보를 가져오는 함수
function get_equipment_infos(equm, today, working_time, state, working, user){
  // SQL문 3번 장비 정보 
  var connection3 = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'meta_0'
  });
  // array 사용해서 장비 상태 가져오기
  connection3.connect();
  for (i in equm) {
    connection3.query(`select State,User,Time from ${equm[i]}_now ORDER BY seq desc limit 1`,
      function (err, result, field) {

        working_time.push(parseInt((today - result[0].Time) / 60000));
        if (result[0].State == null) {
          state.push("대기 중..");
          working.push("off.png");
          connection3.query(`update user set unset=1 where User_no=${result[0].User}`);
          user.push("n.png");
        } else {
          state.push(result[0].State);
          working.push("on.gif");
          connection3.query(`update user set unset=0 where User_no=${result[0].User}`);
          user.push(`user${result[0].User}.gif`);
        }
      });
  }
}