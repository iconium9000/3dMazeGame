console.log('exp.js: init')
// ----------------------------------------
// Setup
// ----------------------------------------
var express = require('express')
var exp = express()
var serv = require('http').Server(exp)
var io = require('socket.io')(serv, {})
var fs = require('fs')
var pt = require('./client/point.js')
var mg = require('./client/game.js')
var fu = require('./client/functions.js')
var Emitter = require('./client/Emitter.js')

var app = {
	sockets: {},
	init: () => {

		exp.get('/', (req, res) => res.sendFile(__dirname + '/client/index.html'))
		exp.use('/client', express.static(__dirname + '/client'))

		var port = 2000
		serv.listen(port)

		process.openStdin().addListener("data", d => app.set.console(fu.strsplit(d.toString().trim(), ' ')))

		io.sockets.on('connection', socket => socket.on('handShake', info => app.get.handShake(socket, info)))

		mg.init()

		app.set.reset('server')

		console.log('Server Active')
	},

	// Set (send)
	set: {
		console: (set) => {
			// set: {<token>, <msg>}
			if (app.set[set.token]) {
				app.set[set.token]('server', set.msg)
			}
		},
		handShake: (id, info) => {

			// get socket from id
			var s = app.sockets[info.id]

			s.emit('handShake', info)


			for (var i in mg.level) {

				var l = mg.level[i].cell
				var u = {}

				for (var j in l) {
					u[j] = mg.cell.get.status(l[j])
				}

				s.emit('status', u)
			}

			app.set.msg('server', `New Client '${s.name}'`)

		},
		emit: (token, msg, id) => {
			for (var i in app.sockets) {
				if (i != id) {
					app.sockets[i].emit(token, msg)
				}
			}
		},

		reset: (id, msg) => {

			app.set.msg('server', msg || 'Reseting level...')

			var data = JSON.parse(fs.readFileSync('data.txt'))

			// data is an array of objects
			//	preferably (but not neccesarily) broken up into groups of levels
			for (var i in data) {

				// data[i] is a level in 'status' state

				// get
				var map = mg.cell.set.status(data[i])
				var flag = {}

				// update each of the modified cells
				mg.tf.updateBrushMap(map)

				// efficiently distribute levels to each fo the modified cells
				mg.tf.distributeWires(map, flag)

				// efficiently distribute levels to each of the modified cells
				mg.tf.distributeLevels(map, flag)

				// send status clients
				app.set.emit('status', data[i])
			}


		},


		msg: (id, msg) => {
			console.log(msg = `server: '${msg}'`)
			app.set.emit('msg', msg)
		},
		print: (id, msg) => {
			eval(`console.log(${msg})`)
		},
		save: (id, msg) => {
			app.set.msg('server', msg || 'Saving Game...')

			var save = []

			for (var i in mg.level) {
				var l = mg.level[i].cell

				var s = {}
				for (var j in l) {
					s[j] = mg.cell.get.status(l[j])
				}

				save.push(s)

			}

			var text = JSON.stringify(save).replace(/},"/g, '},\n"').replace(/}},/g,'}\n},\n')
			fs.writeFile('data.txt', text)
		},
		kick: (id, msg) => {

		}
	},

	// Get (Receive)
	get: {
		handShake: (socket, info) => {

			app.sockets[socket.id = fu.randKey(app.sockets)] = socket
			socket.name = info

			info = {
				id: socket.id,
				name: socket.name
			}

			var f = i => socket.on(i, msg => app.get[i](socket, msg))
			for (var i in app.get) {
				f(i)
			}

			app.set.handShake('server', info)
		},

		disconnect: (socket) => {

			app.set.msg('server', `Disconnected '${socket.name}'`)

			delete app.sockets[socket.id]
		},

		msg: (socket, msg) => {
			msg = `${socket.name}: '${msg}'`
			console.log(msg)
			app.set.emit('msg', msg)
		},

		status: (socket, status) => {

			var flag = {}
			var map = mg.cell.set.status(status)

			// update each of the modified cells
			mg.tf.updateBrushMap(map)

			// efficiently distribute levels to each fo the modified cells
			mg.tf.distributeWires(map, flag)

			// efficiently distribute levels to each of the modified cells
			mg.tf.distributeLevels(map, flag)

			app.set.emit('status', status, socket.id)

		}
	}
}

app.init()
