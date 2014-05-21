var frame = document.getElementById("frame");
var context = frame.getContext("2d");
context.strokestyle = "red";
var socket = io.connect('http://172.18.182.25:3000');
var power = 0;

function bind(obj, func) {
  return function (event) {
    func.call(obj, event);
  }
}

function user() {
  this.name = "";
  this.online = 0;
  this.x = 0;
  this.y = 0;
  this.number = 0;
}

user.prototype = {
  draw: function () {
    if (this.online == 0) return;
    if (this.number == 1) {
      context.fillStyle = "red";
      context.fillRect(this.x - 25, this.y - 10, 50, 20);
    } else {
      context.fillStyle = "green";
      context.fillRect(this.x - 25, this.y - 10, 50, 20);
    }
  }
}

function Ball() {
  this.x = 300;
  this.y = 300;
  this.radius = 10;
}

Ball.prototype = {
  constructor: Ball,
  draw: function () {
    context.beginPath();
    context.strokeStyle = "black";
    context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    context.stroke();
  }
};

function redraw() {
  socket.emit('redraw', "");
}

function eventHandler(event) {
  socket.emit('eventHandler', event.keyCode);
}


socket.on('update1', function(data) {
  // alert("good");
  var user = data;
  player1.name = user.name;
  player1.online = user.online;
  player1.x = user.x;
  player1.y = user.y;
  // alert(user.online);
  if (user.online == 1) {
    $("#p1").css("display", "none");
    var p1 = document.createElement("text");
    p1.innerHTML = "Player 1: " + player1.name;
    p1.style.display = "block";
    p1.id = "p1name";
    $("#p1").after(p1);
    $("#p1").next().after($("<button></button>").text("Logout").attr("id", "lg1"));
    $("#lg1").click(function() {
      socket.emit('logout', 1);
    });
  } else {
      $("#p1name").remove();
      $("#lg1").remove();
      $("#p1").css("display", "block");
  }
});

socket.on('update2', function(data) {
  var user = data;
  player2.name = user.name;
  player2.online = user.online;
  player2.x = user.x;
  player2.y = user.y;
  if (user.online == 1) {
    $("#p2").css("display", "none");
    var p2 = document.createElement("text");
    p2.innerHTML = "Player 2: " + player2.name;
    p2.style.display = "block";
    p2.id = "p2name";
    $("#p2").after(p2);
    $("#p2").next().after($("<button></button>").text("Logout").attr("id", "lg2"));
    $("#lg2").click(function() {
      socket.emit('logout', 2);
    });
  } else  {
      $("#p2name").remove();
      $("#lg2").remove();
      $("#p2").css("display", "block");
  }
});

socket.on('change1', function(data) {
  player1.x = data.x;
  player1.y = data.y;
});

socket.on('change2', function(data) {
  player2.x = data.x;
  player2.y = data.y;
})

socket.on('ballUpdate', function(data) {
  theBall.x = data.x;
  theBall.y = data.y;
  theBall.radius = data.radius;
});

var theBall = new Ball;
var player1, player2;

player1 = new user;
player2 = new user;


$("#bt1").click(function(event) {
  var text = event.currentTarget.previousSibling.previousSibling.value;
  if (text == "") {
    alert("Please write your name!");
      return;
  }
  socket.emit('login1', text);
});

$("#bt2").click(function(event) {
  var text = event.currentTarget.previousSibling.previousSibling.value;
  if (text == "") {
    alert("Please write your name!");
      return;
  }
  socket.emit('login2', text);
});

socket.on('power', function(data) {
  if (data == 1) {
    $("#start").click(function() {
      socket.emit('start', "");
    });
    $(window).keydown(eventHandler);
  } else {
      $("#start").unbind("click");
      $(window).unbind("keydown");
  }
  power = data;
});


$(this).load(function () {
  socket.emit('check', "");
});

$("#input").keypress(function() {
  if (event.keyCode != 13) return;
  var text = event.currentTarget.value;
  event.currentTarget.value = "";
  socket.emit('newMessage', text);
})

socket.on('Error', function(data) {
  alert(data);
});

socket.on('power', function(data) {
  power = data;
});

socket.on('updateComment', function(data) {
  $("#messages").empty();
  for (i in data) {
    var text = $("<p></p>").text(data[i].name + ": " + data[i].comment);
    $("#messages").append(text);
  }
});

socket.on('draw', function(data) {
  context.clearRect(0, 0, 600, 300);
  player1.draw();
  player2.draw();
  theBall.draw();
});

socket.on('start', function() {
  alert(5);
  setInterval(redraw, 10);
});