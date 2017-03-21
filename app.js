console.log('app.js: init')
// ----------------------------------------
// Setup
// ----------------------------------------
var express = require('express')
var app = express()
var serv = require('http').Server(app)
var io = require('socket.io')(serv, {})
var fs = require('fs')
var pt = require('./client/point.js')
var mg = require('./client/game.js')
var Emitter = require('./client/Emitter.js')
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/client/index.html')
})
app.use('/client', express.static(__dirname + '/client'))
var port = 2000
serv.listen(port)
// ----------------------------------------
// Functions
// ----------------------------------------
var string = 'this is some text'
var readMe = fs.readFileSync('test.txt', 'utf8')
console.log(readMe)
// ----------------------------------------
// Console Setup
// ----------------------------------------
process.openStdin().addListener("data", function (d) {
	var string = d.toString().trim()
	var split = string.split(' ')
	switch (split[0]) {
		case "say":
			var msg = "server: "
			for (var i = 1; i < split.length; ++i) {
				msg += split[i] + ' '
			}
			console.log(msg)
			socketEmiter.emit('action', function (s) {
				s.emit('msg', msg)
			})
			break
		case 'clear':
			level.clear()
			socketEmiter.emit('action', function (s) {
				s.emit('clear')
			})
	}
})
// ----------------------------------------
// Socket Setup
// ----------------------------------------
var level = new mg.Level()
console.log("Server Active")
var sockets = []
socketEmiter = new Emitter()
io.sockets.on('connection', function (socket) {
	do {
		socket.id = Math.random()
	} while (sockets[socket.id] != null)
	sockets[socket.id] = socket
	console.log('socket connection ' + socket.id)
	socket.emit('handShake', level.cs)
	socket.on('disconnect', function () {
		console.log('disconnect socket ' + socket.id)
		delete sockets[socket.id]
	})
	socket.on('msg', function (msg) {
		console.log(msg)
	})
	socketEmiter.on('action', function (action) {
		action(socket)
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
