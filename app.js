console.log('app.js: init')

// ----------------------------------------
// Setup
// ----------------------------------------
var express = require('express')
var app = express()
var serv = require('http').Server(app)
var io = require('socket.io')(serv,{})
var fs = require('fs')

var pt = require('./client/point.js')
var mg = require('./client/game.js')

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html')
})
app.use('/client',express.static(__dirname + '/client'))

serv.listen(2000)

// ----------------------------------------
// Functions
// ----------------------------------------

var string = 'this is some text'

var readMe = fs.readFileSync('test.txt', 'utf8')
console.log(readMe)

// ----------------------------------------
// Socket Setup
// ----------------------------------------

console.log("Server Active")
var sockets = []

io.sockets.on('connection', function(socket) {
	do {
		socket.id =
		 Math.random()
	} while (sockets[socket.id] != null)
	sockets[socket.id] = socket
	console.log('socket connection ' + socket.id)
	socket.emit('handShake')
	socket.on('disconnect',function() {
		console.log('disconnect socket ' + socket.id)
		delete sockets[socket.id]
	})
	socket.on('msg',function(msg){
		console.log(msg)
	})
})

// ----------------------------------------
// Tick
// ----------------------------------------

// var dt = 20
// var state = {
//
// }
//
// setInterval( function() {
// 	for (var i in sockets) {
// 		var s = sockets[i]
// 		s.emit('tick',state)
// 	}
// }, dt)
