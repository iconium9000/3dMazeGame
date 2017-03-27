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
var limbo = false

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html')
})
app.use('/client', express.static(__dirname + '/client'))
var port = 2000
serv.listen(port)
// ----------------------------------------
// Console Setup
// ----------------------------------------
process.openStdin().addListener("data", function(d) {
	var string = d.toString().trim()
	var split = string.split(' ')
	if (limbo) {
		if (split[0] == 'y') {
			console.log('killing server...')
			process.exit(0)
		} else {
			limbo = false
		}

	} else {

		switch (split[0]) {
			case "say":

				var msg = "server: "

				for (var i = 1; i < split.length; ++i) {
					msg += split[i] + ' '
				}

				console.log(msg)

				for (var i in sockets) {
					sockets[i].emit('msg', msg)
				}

				break

			case 'clear':

				console.log('clearing level...')
				for (var i in sockets) {
					sockets[i].emit('clear')
				}
				mg.action('clear')
				break

			case 'kill':

				console.msg('Saving game...')

				for (var i in sockets) {
					sockets[i].emit('kill')
				}

				fs.writeFileSync('test.txt', JSON.stringify(mg.observe('status', {
					token: 'all',
					id: 'server'
				})))

				console.log('Ready to kill? (y/n)')
				limbo = true
				break
			case 'save':
				console.msg('Saving game...')
				fs.writeFile('test.txt', JSON.stringify(mg.observe('status', {
					token: 'all',
					id: 'server'
				})))
				break
		}
	}
})

setInterval(function() {
	if (!limbo) {
		console.msg('Autosaving game...')
		fs.writeFile('test.txt', JSON.stringify(mg.observe('status', {
			token: 'all',
			id: 'server'
		})))
	}
}, 1e5)

// ----------------------------------------
// Socket Setup
// ----------------------------------------
console.log("Server Active")
var sockets = []
socketEmitter = new Emitter()

console.msg = function(m) {
	m = `server: ${m}`
	console.log(m)
	for (var i in sockets) {
		sockets[i].emit('msg', m)
	}
}

mg.action('status', {
	token: 'all',
	status: JSON.parse(fs.readFileSync('test.txt'))
})

function printsockets() {
	var s = ''
	for (var i in sockets) {
		s += `${sockets[i].id}, `
	}
	console.log(`[${s}]`)
}

io.sockets.on('connection', function(socket) {

	if (limbo) {
		socket.emit('destroy')
		return
	}

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

	socket.on('status', function(status) {
		mg.action('status', status)

		for (var i in sockets) {
			var s = sockets[i]
			if (s.id != socket.id) {
				s.emit('status', status)
			}
		}
	})

	socket.emit('handShake', socket.id, mg.observe('status', {
		token: 'all',
		id: 'server'
	}))

})
