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
app.get('/', function(req, res) {
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
process.openStdin().addListener("data", function(d) {
	var string = d.toString().trim()
	var split = string.split(' ')
	switch (split[0]) {
		case "say":
			var msg = "server: "
			for (var i = 1; i < split.length; ++i) {
				msg += split[i] + ' '
			}
			console.log(msg)
			socketEmitter.emit('action', function(s) {
				s.emit('msg', msg)
			})
			break
		case 'clear':
			level.clear()
			socketEmitter.emit('action', function(s) {
				s.emit('clear')
			})
	}
})
// ----------------------------------------
// Socket Setup
// ----------------------------------------
console.log("Server Active")
var sockets = []
socketEmitter = new Emitter()

function printsockets() {
	var s = ''
	for (var i in sockets) {
		s += `${sockets[i].id}, `
	}
	console.log(`[${s}]`)
}

io.sockets.on('connection', function(socket) {

	do {
		socket.id = Math.random()
	} while (sockets[socket.id] != null)

	sockets[socket.id] = socket

	console.log('socket connection ' + socket.id)

	printsockets()

	socket.on('disconnect', function() {
		console.log('disconnect socket ' + socket.id)
		delete sockets[socket.id]
		printsockets()
	})

	socket.on('msg', function(msg) {
		var s = `${socket.id}: '${msg}'`
		console.log(s)
		for (var i in sockets) {
			sockets[i].emit('msg', `${socket.id}: '${msg}'`)
		}
	})

	socketEmitter.on('action', function(action) {
		action(socket)
	})

	socket.on('status', function(status) {
		mg.action('status', status)

		for (var i in sockets) {
			var s = sockets[i]
			if (s.id != status.id) {
				s.emit('status', status)
			}
		}
	})

	var status = []

	for (var i in mg.cells) {
		status.push(mg.observe('status', {
			id: 'server',
			token: 'cell',
			cell: mg.cells[i]
		}))
	}

	socket.emit('handShake', socket.id, status)

})
