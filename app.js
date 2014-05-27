var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');
var jade = require('jade');

var app = express();

var server = require('http').createServer(app)
, io = require('socket.io').listen(server);

server.listen(3000);

function bind(obj, func) {
  return function (event) {
    func.call(obj, event);
  }
}

function user(num, x, y) {
  this.name = "";
  this.online = 0;
  this.x = x;
  this.y = y;
  this.ip = "";
  this.number = num;
}

user.prototype = {
  logIn: function (name, ip) {
    this.name = name;
    this.online = 1;
    this.ip = ip;
    console.log(this.name + " has logined.");
    console.log("IP is " + this.ip);
  },
  logout: function () {
    console.log(this.name + " has logouted.")
    this.online = 0;
    this.name = "";
    this.ip = "";
  },
  move: function (distance) {
    var p = this.x + distance;
    var width = 600;
    if (p + 25 >= width) p = this.x;
    if (p - 25 <= 0) p = this.x;
    if (this.x == p) return;
    this.x = p;
    if ((theBall.moving == false) && (theBall.bind == this.number)) {
      p = theBall.x + distance;
      width = 600;
      if (p + theBall.radius > width) p = 2 * width - p;
      if (p - theBall.radius < 0) p = p * -1;
      theBall.x = p;
    }
  },
  draw: function () {
    if (this.online == 0) return;
    if (this.number == 1) {
      context.fillStyle = "red";
      context.fillRect(this.x - 25, this.y - 10, 50, 20);
    } else {
      context.fillStyle = "green";
      context.fillRect(this.x - 25, this.y - 10, 50, 20);
    }
  },
  reset: function(socket) {
    if (this.number == 1) {
      this.x = 300;
      this.y = 290;
    } else {
      this.x = 300;
      this.y = 10;
    }
    if (this.number == 1) socket.emit('change1', this);
    else socket.emit('change2', this);
  }
}

function visitor() {
  this.name = "";
  this.comment = "";
  this.x = 0;
  this.y = Math.random() * 300;
  this.speed = 200;
  this.moving = 1;
}

visitor.prototype = {
  move: function(inv) {
    if (this.moving == 0) return;
    this.x += this.speed * inv / 1000;
    if (this.x >= 600) this.moving = 0;
  }
}

function Ball(gSpeed, pSpeed, radius) {
  this.gSpeed = gSpeed;
  this.pSpeed = pSpeed;
  this.x = 300;
  this.y = 300 - radius - 20;
  this.radius = radius;
  this.moving = false;
  this.bind = 1;
  this.waitFor = 2;
}

Ball.prototype = {
  constructor: Ball,
  move: function (socket) {
    if (this.moving == false) return;
    this.x += this.pSpeed * 50 / 1000;
    if (this.x - this.radius < 0) {
      this.x = -1 * this.x;
      this.pSpeed *= -1;
    }
    if (this.x + this.radius > 600) {
      this.x = 2 * 600 - this.x;
      this.pSpeed *= -1;
    }
    this.y += this.gSpeed * 10 / 1000;
    if (this.y - this.radius < 0) {
      io.sockets.emit('end', "Winner is " + player1.name + "!");
      this.moving = false;
      this.reset(2);
      player1.reset(socket);
      player2.reset(socket);
      this.bind = 2;
    }
    if (this.y + this.radius > 300) {
      io.sockets.emit('end', "Winner is " + player2.name + "!");
      this.moving = false;
      this.reset(1);
      player1.reset(socket);
      player2.reset(socket);
      this.bind = 1;
    }
    if ((player1.y - this.y <= this.radius + 10) && (Math.abs(this.x - player1.x) <= this.radius + 25)) {
      this.gSpeed *= -1;
      this.waitFor = 2;
    }
    if ((this.y - player2.y <= this.radius + 10) && (Math.abs(this.x - player2.x) <= this.radius + 25)) {
      this.gSpeed *= -1;
      this.waitFor = 1;
    }
  },
  start: function(socket) {
    var that = this;
    var move = function () {
      bind(that, that.move(socket));
    }
    interval = setInterval(move, 10);
  },
  draw: function () {
    context.beginPath();
    context.strokeStyle = "black";
    context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    context.stroke();
  },
  reset: function(num) {
    if (num == 1) {
      this.x = 300;
      this.y = 300 - this.radius - 20;
    } else {
      this.x = 300;
      this.y = 0 + this.radius + 20;
    }
  },
  end: function() {
    clearInterval(interval);
  }
};

function gameStart(socket) {
  if ((player1.online == 0) || (player2.online == 0)) return;
  console.log("The game has started.")
  theBall.start(socket);
}


var message = new Array(), numOfComment = 0;

var player1 = new user(1, 300, 290), player2 = new user(2, 300, 10), theBall = new Ball(160, 120, 10);

var interval;


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', routes);
// app.use('/users', users);


app.get('/', function (req, res) {
  // console.log('picture');
  jade.renderFile('./public/index.jade', {name: "William"}, function(err, html) {
    if (err) {
      console.log("Fail to load!");
      return;
    }
    res.send(html);
  });
})

app.get('/background', function (req, res) {
  console.log('picture');
  res.sendfile("./public/images/background.jpg");
})

 // catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

io.sockets.on('connection', function (socket) {
  var ip = socket.handshake.address.address;

  socket.on('check', function(data) {
    console.log('Has checked.')
    if ((player1.online == 1) || (player2.online == 1)) {
      socket.emit('update1', player1);
      socket.emit('update2', player2);
    }
    io.sockets.emit('updateComment', message);
  });

  socket.on('start', function(data) {
    if (ip != player1.ip) {
      socket.emit('Error', "You don't have the authority!");
      return;
    }
    // if ((player1.online == 0) || (player2.online == 0)) {
    if (0) {
      socket.emit('Error', "The number of player is not enough!");
      return;
    }
    gameStart(socket);
    console.log("The game has started.")
    io.sockets.emit('start', "");
  });

  socket.on('login1', function(data) {
    if (ip == player2.ip) {
      socket.emit('Error', "You can't login for twice!");
      return;
    }
    player1.logIn(data, ip);
    io.sockets.emit('update1', player1);
    socket.emit('power', 1);
  });

  socket.on('login2', function(data) {
    if (ip == player1.ip) {
      socket.emit('Error', "You can't login for twice!");
      return;
    }
    player2.logIn(data, ip);
    io.sockets.emit('update2', player2);
    socket.emit('power', 1);
  });

  socket.on('logout', function(data) {
    if ((ip != player1.ip) && (ip != player2.ip)) {
      socket.emit('Error', "You hasn't logined!!!");
      return;
    }
    if ((ip == player1.ip) && (data == 1)) {
      player1.logout();
      io.sockets.emit('update1', player1);
    }
    if ((ip == player2.ip) && (data == 2)) {
      player2.logout();
      io.sockets.emit('update2', player2);
    }
    socket.emit('power', 0);
  });

  socket.on('newMessage', function(data) {
    console.log("Receive a new message.");
    var newVisitor = new visitor;
    newVisitor.comment = data;
    if (ip == player1.ip) newVisitor.name = player1.name;
    if (ip == player2.ip) newVisitor.name = player2.name;
    if ((ip != player1.ip) && (ip != player2.ip)) newVisitor.name = "打酱油的" + ip;
    console.log("Add a new comment.");
    message[numOfComment] = newVisitor;
    var num = numOfComment;
    var messageMove = function() {
      bind(message[num], message[num].move(10));
    }
    setInterval(messageMove, 10);
    numOfComment++;
    io.sockets.emit('updateComment', message);
  });

  socket.on('eventHandler', function(data) {
    if (data == 32) {
      if ((ip == player1.ip) && (theBall.bind == 1)) {
        theBall.moving = true;
      }
      if ((ip == player2.ip) && (theBall.bind == 2)) {
        theBall.moving = true;
      }
    }
    if (ip == player1.ip) {
      if (player1.online) {
        if (data == 37) {
          player1.move(-30);
        }
        if (data == 39) {
          player1.move(30);
        }
      }
    }
    if ((player2.online) && (ip == player2.ip)) {
      if (data == 37) {
        player2.move(-30);
      }
      if (data == 39) {
        player2.move(30);
      }
    } 
  });

  socket.on('redraw', function(data) {
    io.sockets.emit('change1', player1);
    io.sockets.emit('change2', player2);
    io.sockets.emit('ballUpdate', theBall);
    io.sockets.emit('updateRunningComment', message);
    io.sockets.emit('draw', "");
  })

});

module.exports = app;
