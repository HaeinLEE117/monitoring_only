var mysql = require('mysql');

module.exports = {
  meta: function (ScaleX, ScaleY, time, product, destination, direction, position, equm
    , working, state, working_time, user, line_color, vehicle_running) {
//      console.log(product);
    //장비 위치
    let left = new Array(522, 552, 856, 186, 191, 810, 1010, 
      1783, 1566, 1342,
      1350, 1510, 2110, 1880, 
      2430, 2585,
      //A동 용접5 용접1 용접4 측정3 측정4
      2535,2535,2775,2600,2800,
      2850);
    let top = new Array(1749, 1949, 1545, 1625, 1925, 1149, 1049, 
      1538, 1728, 1748,
      1475, 1435, 1278, 1328,
       1408, 1408,
      1050,850,960,1170,1170,
      855);

    //AGV line
    let line1_X = new Array(1351, 1451, 1551, 1641, 1641, 1741, 1841, 1941, 2041, 2161);
    let line1_Y = new Array(1300, 1300, 1300, 1250, 1170, 1170, 1170, 1170, 1170, 1170);

    let line2_X = new Array(400, 400, 400, 460, 551, 651, 751, 851, 951, 1051, 1151, 1251, 1351, 1451, 1551,
      1641, 1641, 1741, 1841, 1941, 2041, 2161, 
      2281, 2371, 2371, 2371, 2371, 
      2421, 2521,2621,
      2711,2711,2711,2711);
    let line2_Y = new Array(1600, 1500, 1400, 1320, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300,
      1250, 1170, 1170, 1170, 1170, 1170, 1170, 
      1170, 1120, 1020, 920, 820, 
      730, 730,730,
      780,880,980,1080);


    //html header
    var html = `
    <HTML lang="ko">
    <HEAD>
    <link rel="stylesheet" href="css/style2_2.css" />
    <script src="http://code.jquery.com/jquery-latest.min.js"></script>
    <script type="text/javascript">
    setTimeout("location.reload()", 10000);

</script>

    </HEAD>
    <BODY>
    <h1><a href="/">MAIN</a></h1>
    <div class="floor_1">
    <div class="container1">
    <div class="container2">
        <div class="f_button" style="background-color:lawngreen">F1</div>
        <div class="f_button"><a href="F2" target="_self">F2</a></div>
        <div class="f_button"><a href="F3" target="_self">F3</a></div>
    </div>
</div>

<div id = "line0"></div>
    `;

    //drawing AGV lines
    for (i in line1_X) {
      html = html + `
      <div class = "line1" style = "left : ${line1_X[i]}; top: ${line1_Y[i]}"></div>
      `;
    }

    for (i in line2_X) {
      html = html + `
      <div class = "line2" style = "left : ${line2_X[i]}; top: ${line2_Y[i]}"></div>
      `;
    }

    //html for equipment state DB수정되면 여기도 수정
    for (i in equm) {
      html = html + `
      <div class="popup" style="cursor: pointer; left: ${left[i]}px; top:${top[i]}px"
      onclick="window.open('/state/${equm[i]}', 'window_name'
      , 'width=430,height=500,location=no,status=no,scrollbars=yes');">${equm[i]}</div>
      <div class="state_box" style="left:${left[i]}px; top:${top[i] + 50}px;"><img src="src/${working[i]}" style="margin-right:3px;" />
      ${state[i]} ${working_time[i]}분 경과..</div>
      <div class="user" style="left: ${left[i] + 83}px; top:${top[i] - 8}px;"><img id="user_img" src="src/${user[i]}" /></div>
      `;
    }

    //html for AGV
    for (var i = 0; i < 4; i++) {
      html = html + `
      <div class="car1" style=" left: ${ScaleX[i] - 35}px; top: ${ScaleY[i] - 30}px;">
      <a class="car_product" href="Product_Sample.html" target="_blank" style="visibility: ${product[i]}">info</a><a href="./AGV_DATA/${i + 1}" target="_blank"><img id="car_img" src="src/car${i + 1}.png " />
      <div id="car_text" >${i + 1}호</div><div id="car_state" style="background-color:${vehicle_running[i]}"></div>
      <img src="src/${direction[i]}" style="width: 40px; height: 40px;  position: absolute; left: 10px; top: 30px;" /></a>
  </div>
      `;
    }

    html = html + `<script>
    
    `;

    //여기에 라인별로 색상이 있으면 sytle태그 변경하는 코드 작성하기~

    for (i in line_color) {
      html = html + `
  var selectedItem = document.getElementsByClassName("line${i}");
  for (var j = 0; j < selectedItem.length; j++) {
    selectedItem.item(j).style.background  = "${line_color[i]}";
    selectedItem.item(j).style.border  = "7px solid ${line_color[i]}";
    selectedItem.item(j).style.opacity  = "1";
  }
  setInterval(function () {
    $(".line${i}").fadeToggle();
}, 1000+${i}*200);
  `;
    }


    //closing html
    html = html + `
    
    </script>

    </BODY>
    </HTML>
    `;

    return html;
  }, state_list: function (title, equm_state) {
    var html = `
    <html lang="ko" xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta charset="utf-8" />
        <title></title>
    </head>
    <body>
        <section style=" padding-top: 50px; text-align: center;">
            <h1>${title}</h1>
            <form action="/submit" method="post">
            <input type="hidden" name="equm" value="${title}">
                <p><strong>-작업 내용-</strong></p>
               `;

    for (i in equm_state) {
      html = html + `<input type="radio" name="equm_state" value='${equm_state[i]}'>${parseInt(i) + 1}. ${equm_state[i]}
      <br />`;
    }


    html = html + `<p>
                    <strong><input type="radio" name="equm_state" value=''>작업종료</strong>
                </p>
                <p><br /><strong>작업자 번호::  </strong><input type="text" name="user_number" placeholder="숫자로 입력 1~5"></p>
    
                <input type='submit'>
            </form>
        </section>
    </body>
    </html>`;
    return html;
  }, me_state_list: function (title, equm_state) {
    var html = `
    <html lang="ko" xmlns="http://www.w3.org/1999/xhtml">
    <head>
    <link rel="stylesheet" href="./public/css/StyleSheet1.css" />
        <meta charset="utf-8" />
        <title></title>
    </head>
    <body>
        <section style=" padding-top: 50px; text-align: center;">
            <h1>${title}</h1>
            <form action="/submit" method="post">
            <input type="hidden" name="equm" value="${title}">
                <p><strong>-작업 내용-</strong></p>
                <p>
                <button class="pre" type="button">레이저 가공 전 / 가공 없음</button>
                <p class="pre" style="display:none">
                    <input class="test" type="radio" name="equm_state" value='레이저 가공 전 일반면 로딩'>1. 일반면 로딩
                    <br />
                    <input class="test" type="radio" name="equm_state" value='레이저 가공 전 일반면 측정'>2. 일반면 측정
                    <br />
                    <input class="test" type="radio" name="equm_state" value='레이저 가공 전 일반면  언로딩'>3. 일반면 언로딩
                    <br /><br />
                    <input class="test" type="radio" name="equm_state" value='레이저 가공 전 반전면 로딩'>1. 반전면 로딩
                    <br />
                    <input class="test" type="radio" name="equm_state" value='레이저 가공 전 반전면 측정'>2. 반전면 측정
                    <br />
                    <input class="test" type="radio" name="equm_state" value='레이저 가공 전 반전면  언로딩'>3. 반전면 언로딩
                    <br />
                </p>
                <br />
                <br />
                <button class="laser" type="button" style="">레이저 가공</button>
                <p class="laser" style="display:none">
                    <input class="test" type="radio" name="equm_state" value='일반면 관통 레이저 가공'>1. 일반면 관통
                    <br />
                    <input class="test" type="radio" name="equm_state" value='일반면 하프 레이저 가공'>2. 일반면 하프
                    <br /><br />
                    <input class="test" type="radio" name="equm_state" value='반전면 하프 레이저 가공'>3. 반전면 하프
                    <br />
                </p>
                <br />
                <br />
                <br />
                <button class="after" type="button" style="">레이저 가공 후</button>
                <p class="after" style="display:none">
                    <input class="test" type="radio" name="equm_state" value='레이저 가공 후 일반면 로딩'>1. 일반면 로딩
                    <br />
                    <input class="test" type="radio" name="equm_state" value='레이저 가공 후 일반면 측정'>2. 일반면 측정
                    <br />
                    <input class="test" type="radio" name="equm_state" value='레이저 가공 후 일반면  언로딩'>3. 일반면 언로딩
                    <br /><br />
                    <input class="test" type="radio" name="equm_state" value='레이저 가공 후 반전면 로딩'>1. 반전면 로딩
                    <br />
                    <input class="test" type="radio" name="equm_state" value='레이저 가공 후 반전면 측정'>2. 반전면 측정
                    <br />
                    <input class="test" type="radio" name="equm_state" value='레이저 가공 후 반전면  언로딩'>3. 반전면 언로딩
                    <br />
                </p>                
                <br />
                <br />
                <strong><input type="radio" name="equm_state" value=''>작업종료</strong>
            </p>
            <p><br /><strong>작업자 번호::  </strong><input type="text" name="user_number" placeholder="숫자로 입력 1~5"></p>

            <input type='submit'>
        </form>
    </section>
    <script src="//code.jquery.com/jquery-3.3.1.min.js"></script>
    <script>
        $(document).ready(function () {
            textchange = false;
            $('button.pre').click(function () {
                if (textchange) {
                    textchange = false;
                } else {
                    textchange = true;
                }
                $('p.pre').toggle('500', function () {

                });
            })
            $('button.laser').click(function () {
                if (textchange) {
                    textchange = false;
                } else {
                    textchange = true;
                }
                $('p.laser').toggle('500', function () {

                });
            })
            $('button.after').click(function () {
                if (textchange) {
                    textchange = false;
                } else {
                    textchange = true;
                }
                $('p.after').toggle('500', function () {

                });
            })
        })
    </script>
</body>
</html>`;
    return html;
  }, AGV_info: function (number) {
    var html = `<html lang="ko" xmlns="http://www.w3.org/1999/xhtml">
    <BODY style="text-align:center;">
    <header style="text-align:center; margin-top:35px; margin-bottom:15px;">
        <h1>AGV ${number} 위치정보</h1>
        <img src="../src/car${number}.png" alt="AGV${number}" />
    </header>

    <table border="1" width="50%" bgcolor="white" bordercolor=#003096 cellspacing="2" align="center" style="margin-top:40px">
        <tr align="center" bgcolor="white" style="font-weight:800">
            <td>위치</td>
            <td>목적지</td>
            <td>시간</td>
        </tr>`;


    return html;
  }, floor_3: function (ScaleX, ScaleY, time, product, destination, direction, position, equm
    , working, state, working_time, user, line_color, vehicle_running) {
    //장비 위치
    let left = new Array(290, 290, 740, 1850, 1170, 1850,740);
    let top = new Array(2170, 2420, 2450, 2014, 1994, 1694,2170);

    //AGV line
    let line3_X = new Array(1383,1483,1579,1669,1719,1759,1859);
    let line3_Y = new Array(1656,1656,1656,1606,1536,1476,1476);

    let line1_X = new Array(2680,2770,2870,2970,3060,3060,3060,3060,3150,3250,3350,3450);
    let line1_Y = new Array(1456,1456,1456,1456,1406,1306,1206,1106,1056,1056,1056,1056);


    //html header
    var html = `
    <HTML lang="ko">
    <HEAD>
    <link rel="stylesheet" href="css/style2_2.css" />
    <script src="http://code.jquery.com/jquery-latest.min.js"></script>
    <script type="text/javascript">
    setTimeout("location.reload()", 10000);

</script>

    </HEAD>
    <BODY>
    
    <h1><a href="/">MAIN</a></h1>
    <div class="floor_3">
    <div class="container1">
    <div class="container2">
        <div class="f_button"><a href="F1" target="_self">F1</a></div>
        <div class="f_button"><a href="F2" target="_self">F2</a></div>
        <div class="f_button" style="background-color:lawngreen">F3</div>
    </div>
</div>
<div id = "line0"></div>
    `;

    //drawing AGV lines
    for (i in line3_X) {
      html = html + `
      <div class = "line3" style = "left : ${line3_X[i]}; top: ${line3_Y[i]}"></div>
      `;
    }
    for (i in line1_X) {
      html = html + `
      <div class = "line1" style = "left : ${line1_X[i]}; top: ${line1_Y[i]}"></div>
      `;
    }

    //html for equipment state
    for (i in equm) {
      html = html + `
      <div class="popup" style="cursor: pointer; left: ${left[i]}px; top:${top[i]}px"
      onclick="window.open('/state/${equm[i]}', 'window_name'
      , 'width=430,height=500,location=no,status=no,scrollbars=yes');">${equm[i]}</div>
      <div class="state_box" style="left:${left[i]}px; top:${top[i] + 50}px;"><img src="src/${working[i]}" style="margin-right:3px;" />
      ${state[i]} ${working_time[i]}분 경과..</div>
      <div class="user" style="left: ${left[i] + 83}px; top:${top[i] - 8}px;"><img id="user_img" src="src/${user[i]}" /></div>
      `;
    }

    //html for AGV
    for (var i = 0; i < 4; i++) {
      html = html + `
      <div class="car1" style=" left: ${ScaleX[i] - 35}px; top: ${ScaleY[i] - 30}px;">
      <a class="car_product" href="Product_Sample.html" target="_blank" style="visibility: ${product[i]}">info</a><a href="./AGV_DATA/${i + 1}" target="_blank"><img id="car_img" src="src/car${i + 1}.png " />
      <div id="car_text" >${i + 1}호</div><div id="car_state" style="background-color:${vehicle_running[i]}"></div>
      <img src="src/${direction[i]}" style="width: 40px; height: 40px;  position: absolute; left: 10px; top: 30px;" /></a>
  </div>
      `;
    }

    html = html + `<script>
    
    `;

    //여기에 라인별로 색상이 있으면 sytle태그 변경하는 코드 작성하기~

    for (i in line_color) {
      html = html + `
  var selectedItem = document.getElementsByClassName("line${i}");
  for (var j = 0; j < selectedItem.length; j++) {
    selectedItem.item(j).style.background  = "${line_color[i]}";
    selectedItem.item(j).style.border  = "7px solid ${line_color[i]}";
    selectedItem.item(j).style.opacity  = "1";
  }
  setInterval(function () {
    $(".line${i}").fadeToggle();
}, 1000+${i}*200);
  `;
    }


    //closing html
    html = html + `
    
    </script>

    </BODY>
    </HTML>
    `;

    return html;
  },floor_2: function (ScaleX, ScaleY, time, product, destination, direction, position, equm
    , working, state, working_time, user, line_color, vehicle_running) {
    //장비 위치
    

    //html header
    var html = `
    <HTML lang="ko">
    <HEAD>
    <link rel="stylesheet" href="css/style2_2.css" />
    <script src="http://code.jquery.com/jquery-latest.min.js"></script>
    <script type="text/javascript">
    setTimeout("location.reload()", 10000);

</script>

    </HEAD>
    <BODY>
    <h1><a href="/">MAIN</a></h1>
    <div class="floor_2">
    <div class="container1">
    <div class="container2">
        <div class="f_button"><a href="F1" target="_self">F1</a></div>
        <div class="f_button" style="background-color:lawngreen">F2</div>
        <div class="f_button" ><a href="F3" target="_self">F3</a></div>
    </div>
</div>
<div id = "line0"></div>
    `;

    for (var i = 0; i < 4; i++) {
      html = html + `
      <div class="car1" style=" left: ${ScaleX[i] - 35}px; top: ${ScaleY[i] - 30}px;">
      <a class="car_product" href="Product_Sample.html" target="_blank" style="visibility: ${product[i]}">info</a>
      <a href="./AGV_DATA/${i + 1}" target="_blank"><img id="car_img" src="src/car${i + 1}.png " />
      <div id="car_text" >${i + 1}호</div><div id="car_state" style="background-color:${vehicle_running[i]}"></div>
      <img src="src/${direction[i]}" style="width: 40px; height: 40px;  position: absolute; left: 10px; top: 30px;" /></a>
  </div>
      `;
    }



    //closing html
    html = html + `
    


    </BODY>
    </HTML>
    `;

    return html;
  }, state_list: function (title, equm_state) {
    var html = `
    <html lang="ko" xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta charset="utf-8" />
        <title></title>
    </head>
    <body>
        <section style=" padding-top: 50px; text-align: center;">
            <h1>${title}</h1>
            <form action="/submit" method="post">
            <input type="hidden" name="equm" value="${title}">
                <p><strong>-작업 내용-</strong></p>
               `;

    for (i in equm_state) {
      html = html + `<input type="radio" name="equm_state" value='${equm_state[i]}'>${parseInt(i) + 1}. ${equm_state[i]}
      <br />`;
    }


    html = html + `<p>
                    <strong><input type="radio" name="equm_state" value=''>작업종료</strong>
                </p>
                <p><br /><strong>작업자 번호::  </strong><input type="text" name="user_number" placeholder="숫자로 입력 1~5"></p>
    
                <input type='submit'>
            </form>
        </section>
    </body>
    </html>`;
    return html;
  }
}
