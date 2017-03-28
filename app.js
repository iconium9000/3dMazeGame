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

	var token = split[0]

	var msg = ''

	for (var i = 1; i < split.length; ++i) {
		msg += split[i] + ' '
	}

	if (limbo) {
		if (split[0] == 'y') {
			console.log('killing server...')
			process.exit(0)
		} else if (split[0] == 'n') {
			limbo = false
			console.log('Server reactivated')
		}
	} else {
		action(token, msg)
	}
})

setInterval(function() {
	if (!limbo) {
		action('save', 'Autosaving game...')
	}
}, 1e5)

function action(token, msg, id) {
	switch (token) {
		case 'print':
			msg = ''
			for (var i in sockets) {
				var s = sockets[i]
				msg += `${s.name || s.id}, `
			}
			msg = `[${msg}]`
		case 'msg':
		case 'say':
			msg = `${id || 'server'}: ${msg}`
			console.log(msg)
			for (var i in sockets) {
				sockets[i].emit('msg', msg)
			}

			break

		case 'clear':

			console.log('clearing level...')
			for (var i in sockets) {
				sockets[i].emit('clear', id)
			}
			mg.action('clear')
			break

		case 'kill':

			action('save')

			for (var i in sockets) {
				sockets[i].emit('kill', id)
			}

			console.log('Ready to kill? (y/n)')
			limbo = true
			break

		case 'save':

			action('msg', msg || 'Saving game...', id)

			fs.writeFile('data.txt', JSON.stringify(mg.observe('status', {
				token: 'all',
				id: 'server'
			})))

			break

	}
}

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
	status: JSON.parse(fs.readFileSync('data.txt'))
})



io.sockets.on('connection', function(socket) {

	if (limbo) {
		socket.emit('destroy')
		return
	}

	do {
		socket.id = Math.random()
	} while (sockets[socket.id] != null)

	sockets[socket.id] = socket

	console.log(`socket connection: ${socket.id}`)


	socket.on('disconnect', function() {
		console.log(`disconnect socket: ${socket.name} (${socket.id})`)
		delete sockets[socket.id]
		action('print')
	})

	socket.on('name', function(name) {
		action('msg', `${socket.id} set to '${socket.name = name}'`)
		action('print')
	})

	socket.on('msg', function(msg) {
		action('msg', msg, socket.name || socket.name)
	})

	socket.on('kill', function() {
		action('kill')
	})

	socket.on('clear', function() {
		action('clear')
	})

	socket.on('print', function() {
		action('print')
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
