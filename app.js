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

	var token = ''
	var msg = null
	for (var i in string) {
		var c = string[i]
		if (msg != null) {
			msg += c
		} else if (c == ' ') {
			msg = ''
		} else {
			token += c
		}
	}

	if (limbo) {
		if (token == 'y') {
			console.log('killing server...')
			process.exit(0)
		} else if (token == 'n') {
			limbo = false
			console.log('Server reactivated')
		}
	} else {
		action(token, 'server', msg)
	}
})

setInterval(function() {
	if (!limbo && !mg.game) {
		action('save', 'server', 'Autosaving game...')
	}
}, 1e5)

function action(token, id, msg, key) {
	if (id != 'server' && token != 'msg' && key != 'move' && (!id || !sockets[id] || sockets[id].opped == false ||
			(sockets[id].opped == null && listType == 'whitelist'))) {
		return null
	}

	id = sockets[id] ? sockets[id].name || id : id

	switch (token) {
		case 'reset':
			console.log(`${id}: reset level`)

			if (mg.backup) {
				for (var i in mg.all.player) {
					mg.all.player[i].player = false
				}
				mg.all.player = {}
				for (var i in mg.backup.player) {
					mg.all.player[i] = mg.backup.player[i]
					mg.all.player[i].player = true
				}
				for (var i in mg.all.key) {
					mg.all.key[i].key = false
				}
				mg.all.key = {}
				for (var i in mg.backup.key) {
					mg.all.key[i] = mg.backup.key[i]
					mg.all.key[i].key = true
				}

				var status = {
					token: 'all',
					status: mg.observe.status({
						token: 'all',
						id: 'server'
					})
				}

				for (var i in sockets) {
					sockets[i].emit('status', status)
				}

			} else {
				mg.backup = {
					player: {},
					key: {}
				}
				for (var i in mg.all.player) {
					mg.backup.player[i] = mg.all.player[i]
				}
				for (var i in mg.all.key) {
					mg.backup.key[i] = mg.all.key[i]
				}
			}
			break

		case 'game':

			mg.backup = null
			action('reset', 'server')

			mg.game = (msg == 'true') || (msg == 'false') || !mg.game

			console.log(`${id}: game mode set to '${mg.game}'`)

			for (var i in sockets) {
				sockets[i].emit('game', id, mg.game)
			}

			action(mg.game ? 'deop' : 'op', 'server')
			action(mg.game ? 'whitelist' : 'blacklist', 'server')

			break

		case 'whitelist':
		case 'blacklist':
			console.log(`mode set to '${token}'`)
			listType = token
			break

		case 'op':
		case 'deop':
			for (var i in sockets) {
				var s = sockets[i]
				if (msg) {
					if (s.name == msg) {
						s.opped = token == 'op'
						console.log(`opped: ${s.name}`)
						s.emit(token)
					}
				} else if (s.opped != (token == 'op')) {
					s.opped = token == 'op'
					console.log(`${token}ed: ${s.name}`)
					s.emit(token)
				}

			}
			break

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
			mg.action.clear()
			break

		case 'kill':

			action('save', 'server')

			for (var i in sockets) {
				sockets[i].emit('kill', id)
				delete sockets[i]
			}

			console.log('Ready to kill? (y/n)')
			limbo = true
			break

		case 'save':

			action('msg', id, msg || 'Saving game...')

			fs.writeFile('data.txt', JSON.stringify(mg.observe.status({
				token: 'all',
				id: 'server'
			})))

			break
		case 'status':
			mg.action.status(msg)

			for (var i in sockets) {
				var s = sockets[i]
				if (id != s.id) {
					s.emit('status', msg)
				}
			}
	}
}

// ----------------------------------------
// Socket Setup
// ----------------------------------------
console.log("Server Active")
var listType = 'blacklist'
var sockets = []
socketEmitter = new Emitter()

console.msg = function(m) {
	m = `server: ${m}`
	console.log(m)
	for (var i in sockets) {
		sockets[i].emit('msg', m)
	}
}

mg.action.status({
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
	socket.opped = listType == 'blacklist'

	console.log(`socket connection: ${socket.id}`)

	socket.on('disconnect', function() {
		console.log(`disconnect socket: '${socket.name}' (${socket.id})`)
		delete sockets[socket.id]
		action('print', 'server')
	})

	socket.on('name', function(name) {
		action('msg', 'server', `${socket.id} set to '${socket.name = name}'`)
		action('print', 'server')
	})

	socket.on('game', function(msg) {
		action('game', socket.id, msg)
	})

	socket.on('msg', function(msg) {
		action('msg', socket.id, msg)
	})

	socket.on('kill', function() {
		action('kill', socket.id)
	})

// 	socket.on('reset', function() {
// 		action('reset', 'server') // anybody can reset
// 	})

	socket.on('save', function() {
		action('save', socket.id)
	})

	socket.on('clear', function() {
		action('clear', socket.id)
	})

	socket.on('print', function() {
		action('print', socket.id)
	})

	socket.on('status', function(status, token) {
		action('status', socket.id, status, token)
	})

	socket.emit('handShake', socket.id, listType == 'blacklist', mg.observe.status({
		token: 'all',
		id: 'server'
	}))

})
