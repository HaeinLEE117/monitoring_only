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

//미들웨어 작성 예제 + 쿠키 처리
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

//route, routing
//app.get('/', (req, res) => res.send('Hello World!'))
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


  //목적지를 보고 line 색상을 결정해주는 함수
  function return_line(destination) {
    switch (destination) {
      case 306:
      case 1102:
        return 1;
        break;
      case 101:
      case 406:
        return 2;
        break;
      case 306:
      case 2102:
        return 3;
        break;
      case 14:
        return 4;
        break;
      default:
        return 0;
    }
  }

  //db접근(AGV)
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  connection.connect();
  //SQL문 1번 AGBS_Info 테이블에서 통합정보 제품 운반여부, 차체색상을 가져온다
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
  for (var i = 0; i < 4; i++) {
    connection.query(`select Time,PointNumber,Destination from agvlocation? ORDER BY Time desc limit 1`, [i + 1],
      function (error, result, fields) {
        time.push(result[0].Time);
        position.push(result[0].PointNumber);
        destination.push(result[0].Destination);
        if (result[0].Destination < 0) {
          vehicle_running.push('yellow');
          direction.push("blank.png");
        } else if (result[0].Destination > 0 && result[0].Time) {
          var r = today - result[0].Time;
          if ((r / 6000) > 80) {
            vehicle_running.push('yellow');
            direction.push("blank.png");
          } else {
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
        } else {
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


  //목적지를 보고 line 색상을 결정해주는 함수
  function return_line(destination) {
    switch (destination) {
      case 306:
      case 1102:
        return 1;
        break;
      case 101:
      case 406:
        return 2;
        break;
      case 306:
      case 2102:
        return 3;
        break;
      case 14:
        return 4;
        break;
      default:
        return 0;
    }
  }

  //db접근(AGV)
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  connection.connect();
  //SQL문 1번 AGBS_Info 테이블에서 통합정보 제품 운반여부, 차체색상을 가져온다
  connection.query(`select * from agvs_info ORDER BY VehicleNumber asc`,
    function (error, results, fields) {
      for (i in results) {
        if (results[i].Product) {
          product.push("initial");
        } else {
          product.push("hidden");
        }
      }
    });
  //        SQL문 2번:: 각 agv 호기 테이블에서 시간, 방향, 마지막위치, 목적지(주행여부)를 가져옴
  for (var i = 0; i < 4; i++) {
    connection.query(`select Time,PointNumber,Destination from agvlocation? ORDER BY Time desc limit 1`, [i + 1],
      function (error, result, fields) {
        time.push(result[0].Time);
        position.push(result[0].PointNumber);
        destination.push(result[0].Destination);
        if (result[0].Destination < 0) {
          vehicle_running.push('yellow');
          direction.push("blank.png");
        } else if (result[0].Destination > 0 && result[0].Time) {
          var r = today - result[0].Time;
          if ((r / 6000) > 8000) {
            vehicle_running.push('yellow');
            direction.push("blank.png");
          } else {
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
        } else {
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



//임시 ㅁ2층
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


  //목적지를 보고 line 색상을 결정해주는 함수
  function return_line(destination) {
    switch (destination) {
      case 306:
      case 1102:
        return 1;
        break;
      case 101:
      case 406:
        return 2;
        break;
      case 306:
      case 2102:
        return 3;
        break;
      case 14:
        return 4;
        break;
      default:
        return 0;
    }
  }

  //db접근(AGV)
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  connection.connect();
  //SQL문 1번 AGBS_Info 테이블에서 통합정보 제품 운반여부, 차체색상을 가져온다
  connection.query(`select * from agvs_info ORDER BY VehicleNumber asc`,
    function (error, results, fields) {
      for (i in results) {
        if (results[i].Product) {
          product.push("initial");
        } else {
          product.push("hidden");
        }
      }
    });
  //        SQL문 2번:: 각 agv 호기 테이블에서 시간, 방향, 마지막위치, 목적지(주행여부)를 가져옴
  for (var i = 0; i < 4; i++) {
    connection.query(`select Time,PointNumber,Destination from agvlocation? ORDER BY Time desc limit 1`, [i + 1],
      function (error, result, fields) {
        time.push(result[0].Time);
        position.push(result[0].PointNumber);
        destination.push(result[0].Destination);
        if (result[0].Destination < 0) {
          vehicle_running.push('yellow');
          direction.push("blank.png");
        } else if (result[0].Destination > 0 && result[0].Time) {
          var r = today - result[0].Time;
          if ((r / 6000) > 8000) {
            vehicle_running.push('yellow');
            direction.push("blank.png");
          } else {
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
        } else {
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


  var html = ``;

  setTimeout(() => {
    for (var i = 0; i < 4; i++) {
//3층이 아닌 장소에 있는 agv는 1,2층 버튼 밑에 위치하도록 
      if ((parseInt(position[i]) / 1000) < 1) {
        ScaleX[i] = 85;
        ScaleY[i] = (68 + i * 30);
      } else if ((parseInt(position[i]) / 1000) > 2) {
        ScaleX[i] = 405619;
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
      <td>${results[i].time}</td></tr>`;
    }
    html = html +`</tr></table>  </BODY>  </HTML>
`;
response.send(html);

});
});

//혀ㅛ


app.get('/F1_2', function (request, response) {
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


  //목적지를 보고 line 색상을 결정해주는 함수
  function return_line(destination) {
    switch (destination) {
      case 307:
      case 2101:
        return 1;
        break;
      case 101:
      case 406:
        return 2;
        break;
      case 306:
      case 2307:
        return 3;
        break;
      case 14:
        return 4;
        break;
      default:
        return 0;
    }
  }

  //db접근(AGV)
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'agv_monitor'
  });
  connection.connect();
  //SQL문 1번 AGBS_Info 테이블에서 통합정보 제품 운반여부, 차체색상을 가져온다
  connection.query(`select * from agvs_info ORDER BY VehicleNumber asc`,
    function (error, results, fields) {
      for (i in results) {
        if (results[i].Product) {
          product.push("initial");
        } else {
          product.push("hidden");
        }
      }
    });
    
  //        SQL문 2번:: 각 agv 호기 테이블에서 시간, 방향, 마지막위치, 목적지(주행여부)를 가져옴
  for (var i = 0; i < 4; i++) {
    connection.query(`select Time,PointNumber,Destination from agvlocation? ORDER BY Time desc limit 1`, [i + 1],
      function (error, result, fields) {
        time.push(result[0].Time);
        position.push(result[0].PointNumber);
        destination.push(result[0].Destination);
        if (result[0].Destination < 0) {
          vehicle_running.push('yellow');
          direction.push("blank.png");
        } else if (result[0].Destination > 0 && result[0].Time) {
          var r = today - result[0].Time;
          if ((r / 6000) > 80) {
            vehicle_running.push('yellow');
            direction.push("blank.png");
          } else {
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
        } else {
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
    response.send(db_template.meta(ScaleX, ScaleY, time, product, destination, direction, position, equm,
      working, state, working_time, user, line_color, vehicle_running));


});
app.get('/tester', function (request, response) {
  var tmp = [1,2,3,4,5,6,7,8,9,7,6,54,3,2,54,62,4315,76]
    for (var i = 0; i < 4; i++) {
//1층이 아닌 장소에 있는 agv는 2, 3 층 버튼 밑에 위치하도록 
      if ((parseInt(tmp[i]) / 1000) > 2) {
        ScaleX[i] =(420);
        ScaleY[i] = (68 +  i * 30);
      } else if ((parseInt(tmp[i]) / 1000) > 1) {
        ScaleX[i]=(247);
        ScaleY[i]=(88 +  i * 30);
      }

    }
    html = db_template.meta(tmp, tmp, tmp, tmp, tmp, tmp, tmp, tmp,
      tmp, tmp, tmp, tmp, tmp, tmp);
  


    response.send(html);


});

app.get('/F1_3', function (request, response) {
  let product = new Array;
  let color = new Array;
  let visibility = new Array;
  let direction = new Array;
  let time = new Array;
  let position = new Array;
  let destination = new Array;

  function agv_location(callback) {
    for (var i = 0; i < 11; i++) {
      var sql_str = `select Time,PointNumber,Destination from agvlocation${i + 1} ORDER BY Time desc limit 1`;
      var sql2 = require('./db_sql2')(sql_str);
      sql2.select(function (err, data) {
        time.push(data[0].Time);
        position.push(data[0].PointNumber);
        destination.push(data[0].Destination);
      });
    }
    callback();
  }
  function log_out() {
    console.log(position);
  }

  console.log('app.js started');

  //SQL문 1번 AGBS_Info 테이블에서 통합정보 제품 운반여부, 차체색상을 가져온다
  sql.select(function (err, data) {
    for (i in data) {
      product.push(data[i].Product);
      color.push(data[i].Color);
      // 차량의 좌, 우 방향과 상품을 화면상에서 숨겨둔다
      visibility.push("hidden");
      direction.push("blank.png");
    }
    response.send(product);
    agv_location(log_out);
  });
});



// proceed input from AGV
// AGV에서 보내는 정보를 DB에 처리하는 부분 API1
app.get('/AGV/:VN/:point/:des/:pro', async (req, res) => {
  var fail_res = {message:'failed'};
  var ok_res = {message : 'query ok'};
  
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

// proceed input from equipment
// 장비에서 보내는 정보를 DB에 처리하는 부분 API2
app.get('/equ_input/:equ_name/:process/:order_no', async (req, res) => {
  var fail_res = {message:'failed'};
  var ok_res = {message : 'query ok'};
  
  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'meta_0'
  });
  connection.connect();

  var sql = `insert into ${req.params.equ_name}_status(state, order_no, time) VALUES (${req.params.process},"${req.params.order_no}", now())`;
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
