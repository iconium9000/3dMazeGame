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

var sockets = {}

// ----------------------------------------
// Functions
// ----------------------------------------

function strsplit(string, char) {
	var index = string.indexOf(char)
	if (index < 0) {
		return {
			token: string,
			msg: ''
		}
	} else {
		return {
			token: string.substr(0, index),
			msg: string.substr(index + 1)
		}
	}
}

function strkey(array, element) {
	var k = Object.keys(array)
	var i = 0
	var string = ''
	while (i < k.length) {
		string += array[k[i]][element]
		if (i++ < k.length - 1) {
			string += ', '
		}
	}
	return `[${string}]`
}

// ----------------------------------------
// Console Setup
// ----------------------------------------

process.openStdin().addListener("data", function(d) {
	var s = strsplit(d.toString().trim(), ' ')
	if (action[s.token]) {
		action[s.token]('server', s.msg)
	}

})

setInterval(function() {
	if (!limbo && !mg.game) {
		action.save('server', 'Autosaving game...')
	}
}, 1e5)

var observe = {
	rand: function() {
		var id = Math.random()
		return sockets[id] ? observe.rand() : id
	},
	opped: function(id) {
		return id == 'server' || socket[id].opped
	},
	name: function(id) {
		return id == 'server' ? id : sockets[id].name
	},
	print: function(id) {
		action.msg(id, strkey(sockets, 'name'))
	}
}
var action = {
	lambda: function(id, f) {
		for (var i in sockets) {
			f(sockets[i])
		}
	},
	emit: function(id, token, msg) {
		for (var i in sockets) {
			sockets[i].emit(token, msg)
		}
	},
	emitnor: function(id, token, msg) {
		for (var i in sockets) {
			if (id != i) {
				sockets[i].emit(token, msg)
			}
		}
	},
	op: function(id) {
		if (id != 'server' && sockets[id]) {
			sockets[id].op = true
		}
	},
	msg: function(id, msg) {
		msg = `${observe.name(id)}: ${msg}`
		console.log(msg)
		action.emit(id, 'msg', msg)
	},
	save: function(id, msg) {
		console.log(`${id}: ${msg || 'Saving game...'}`)
		action.emit(id, 'save', msg || 'Saving game...')
	},
	kill: function(id) {
		var id = id || 'server'
		observe.print(id)
		action.save(id)
		action.emit(id, 'kill')
	},
	y: function() {
		process.exit(0)
	}
}
var rcv = {
	msg: function(socket, msg) {
		action.msg(socket.id, msg)
	},
	kill: function(socket) {
		action.kill(socket.id)
	},
	status: function(socket, status) {
		mg.status.action(status)
		emitnor(socket.id, 'status', status)
	},
	disconnect: function(socket) {
		delete sockets[socket.id]
		observe.print('server')
	}
}

// ----------------------------------------
// Socket Setup
// ----------------------------------------
console.log("Server Active")

io.sockets.on('connection', function(socket) {
	socket.on('handShake', function(info) {
		socket.name = info.name
		info.id = socket.id = observe.rand()
		sockets[info.id] = socket
		observe.print('server')
		info.status = mg.status.observe()
		socket.emit('handShake', info)

		for (var i in rcv) {
			socket.on(i, function(msg) {
				rcv[i](socket, msg)
			})
		}
	})
})
