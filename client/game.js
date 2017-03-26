console.log("game.js: init")
try {
	pt = require('./point.js')
	console.log('game.js: init point.js')
} catch (e) {
	if (pt != null) {
		console.log('game.js: rcv point.js')
	} else {
		throw 'game.js: point.js not found'
	}
}

function forEach(a, f) {
	for (var i in a) {
		f(a[i])
	}
}

// -----------------------------------------------------------------------------
// MazeGame
// -----------------------------------------------------------------------------
var mg = {
	offset: 5,
	cellSize: 30,
	cellWidth: 25,
	cells: [],
	portals: [],
	wires: [],
	events: [],
	status: null,
	shift: pt.zero(),
	drawRect: function(g, s, r, c, f) {
		var gdot = `${f}Style`
		var ptdot = `${f == 'stroke' ? 'draw' : f}Rect`
		return function(cell) {
			if (cell[s]) {
				var p = pt.sum(mg.shift, pt.scale(cell, mg.cellSize))
				p.r = r
				g[gdot] = c
				pt[ptdot](g, p)
			}
		}
	},
	directions: {
		'up': {
			key: 'ArrowUp',
			x: 0,
			y: -1,
			z: 0
		},
		'dn': {
			key: 'ArrowDown',
			x: 0,
			y: 1,
			z: 0
		},
		'rt': {
			key: 'ArrowRight',
			x: 1,
			y: 0,
			z: 0
		},
		'lf': {
			key: 'ArrowLeft',
			x: -1,
			y: 0,
			z: 0
		},
	},
	states: {
		'space': {},
		'wire': {},
		'wall': {},
		'door': {},
		'pad': {},
		'portal': {}
	},
	mode: 'pan',
	modes: {
		'pan': {
			str: 'pan',
			key: 'e'
		},
		'space': {
			str: 'spc',
			key: 'x'
		},
		'wire': {
			str: 'wir',
			key: 'v',
		},
		'wall': {
			str: 'wll',
			key: 'w',
		},
		'door': {
			str: 'dor',
			key: 'd',
		},
		'pad': {
			str: 'pad',
			key: 'a',
		},
		'portal': {
			str: 'ptl',
			key: 'z',
		},
		'player': {
			str: 'plr',
			key: 'c'
		},
		'key': {
			str: 'key',
			key: 'f'
		}
	}
}
mg.modeKeys = Object.keys(mg.modes)
mg.setStates = function(g) {
	var cw = mg.cellWidth
	var cs = mg.cellSize
	mg.states.space.draw = mg.drawRect(g, 'space', cw / 2, '#404040', 'fill')
	mg.states.wire.draw = mg.drawRect(g, 'wire', cw / 6, '#408000', 'fill')
	mg.states.wall.draw = mg.drawRect(g, 'wall', cs / 2, '#808080', 'fill')
	mg.states.door.draw = mg.drawRect(g, 'door', cw / 2, '#208000', 'fill')
	mg.states.pad.draw = mg.drawRect(g, 'pad', cw / 3, '#208000', 'fill')
	mg.states.portal.draw = mg.drawRect(g, 'portal', cs / 2, '#800080', 'stroke')
}

// -----------------------------------------------------------------------------
// Observe
// -----------------------------------------------------------------------------
mg.observe = function(token, input) {
	switch (token) {
		case 'draw': // ------------------------------------------------------------
			//	input <- gameWindow

			var g = input.display.g
			var w = input.display.width
			var h = input.display.height
			var ms = input.mouse
			var cs = mg.cellSize
			var cw = mg.cellWidth
			var shf = mg.shift

			function shift(p) {
				return pt.sum(shf, pt.scale(p, cs))
			}

			// draw spaces ---------------------------------------
			forEach(mg.cells, mg.states.space.draw)

			// draw walls ----------------------------------------
			forEach(mg.cells, mg.states.wall.draw)

			// draw doors ----------------------------------------
			forEach(mg.cells, mg.states.door.draw)

			// draw wire stubs or pads ---------------------------
			forEach(mg.cells, mg.states.wire.draw)
			forEach(mg.cells, mg.states.pad.draw)

			// draw portals --------------------------------------
			forEach(mg.cells, mg.states.portal.draw)

			// draw wires ----------------------------------------

			// draw players --------------------------------------

			// draw keys -----------------------------------------

			// draw mode rectangle -------------------------------
			var off = mg.offset

			g.lineWidth = 1
			g.strokeStyle = 'white'
			g.fillStyle = 'black'
			g.beginPath()
			g.rect(off, off, 2 * cs, 2 * cs * mg.modeKeys.length)
			g.fill()
			g.beginPath()
			g.rect(off, off, 2 * cs, 2 * cs * mg.modeKeys.length)
			g.stroke()

			g.textAlign = 'center'
			g.fillStyle = 'white'

			for (var i in mg.modeKeys) {
				var m = mg.modeKeys[i]
				var str = mg.modes[m].str
				g.fillText(str, off + cs, off + 2 * cs * i + cs + 1)
				if (m == mg.mode) {
					g.beginPath()
					g.rect(off + cs - cw / 2, off + cs - cw / 2 + 2 * cs * i, cw, cw)
					g.stroke()
				}
			}

			// draw mouse ----------------------------------------
			g.fillStyle = 'white'

			ms.r = 10
			pt.fillCircle(g, ms)

			if (ms.inMode) {
				g.beginPath()
				g.rect(off + cs - cw / 2, off + cs - cw / 2 + 2 * cs * ms.i, cw, cw)
				g.stroke()
			} else {
				g.strokeStyle = 'white'
				var p = pt.sum(shf, pt.scale(ms.point, cs))
				p.r = cw / 2
				pt.drawRect(g, p)
			}

			break

		case 'get': // -------------------------------------------------------------
			//	input: {token:'mouse', mouse:{x,y,z}}
			// 		get cell relative to shift
			//	input: {token: 'point', point:{x,y,z}}
			//		get cell in cell array at point
			//	input: {token: 'string', string:'<x-cord>,<y-cord>'}
			//		get cell in cell array at string's index
			//	input: {token: 'cell', cell: <cell at string>}
			// 		get cell in input
			switch (input.token) {
				//	input.mouse || input.point || input.string || input.cell
				//	input.token = 'mouse' || 'point' || 'string' || 'cell'
				case 'mouse':
					input.point = pt.math(Math.round, pt.factor(pt.sub(input.mouse, mg.shift), mg.cellSize))

				case 'point':
					input.string = `${input.point.x},${input.point.y}`

				case 'string':
					input.cell = mg.cells[input.string]
					if (!input.point) {
						var s = input.string.split(',')
						input.point = {
							x: parseFloat(s[0]),
							y: parseFloat(s[1]),
							z: 0
						}
					}

				case 'cell':
					return input.cell

				default:
					throw `observe(token: 'get', input.token: '${input.token}')`
			}

		case 'status': // ----------------------------------------------------------
			var cell = mg.observe('get', input)

			var status = {
				id: input.id,
				string: cell.string
			}

			if (cell) {
				for (var i in mg.states) {
					if (cell[i]) {
						status[i] = true
					}
				}
			}

			return status

		case 'state': // -----------------------------------------------------------
			var cell = mg.observe('get', input)
			return cell && cell[input.mode]
	}
}
// -----------------------------------------------------------------------------
// Action
// -----------------------------------------------------------------------------
mg.action = function(token, input) {
	switch (token) {
		case 'get': // -------------------------------------------------------------
			//	input <- mg.observe.get.input
			//		input.mouse || input.point || input.string || input.cell
			//		input.token = 'mouse' || 'point' || 'string' || 'cell'
			//	input.time = gameWindow.event.now

			return input.cell = mg.observe('get', input) || (mg.cells[input.string] = {
				x: input.point.x,
				y: input.point.y,
				z: 0,
				string: input.string
			})

		case 'state': // -----------------------------------------------------------
			//	input <- mg.observe.get.input
			//		input.mouse || input.point || input.string || input.cell
			//	input.token = 'mouse' || 'point' || 'string' || 'cell'
			//	input <- mg.action.update.input
			//		input <- mg.observe.get.input
			//		input.tick = gameWindow.tick
			//	input.state
			//	input.mode
			var cell = mg.action('get', input)
			switch (input.mode) {
				case 'space': //--------------------

					if (input.state) {
						cell.space = true
						cell.wall = cell.door = false
					} else {
						cell.space = cell.pad = cell.portal = false
						cell.wire = cell.door || cell.wall
					}

					break

				case 'wire': //---------------------
					if (input.state) {
						cell.wire = true
						cell.space = !cell.wall && !cell.door
					} else {
						cell.wire = false
						cell.wall = cell.wall || cell.door
						cell.door = cell.pad = cell.portal = false
					}

					break

				case 'wall': //---------------------
					if (input.state) {
						cell.wall = true
						cell.space = cell.door = cell.pad = cell.portal = false
					} else {
						cell.wall = false
						cell.space = cell.wire && !cell.door
					}

					break

				case 'door': //---------------------
					if (input.state) {
						cell.door = cell.wire = true
						cell.wall = cell.pad = cell.portal = false
					} else {
						cell.door = false
						cell.space = cell.wire && !cell.wall
					}

					break

				case 'pad': //----------------------
					if (input.state) {
						cell.pad = cell.wire = cell.space = true
						cell.wall = cell.door = cell.portal = false
					} else {
						cell.pad = false
					}

					break

				case 'portal': //--------------------
					if (input.state) {
						cell.portal = cell.wire = cell.space = true
						cell.wall = cell.door = cell.pad = false
					} else {
						cell.portal = false
					}

					break

			}

			mg.status(cell)

		case 'update': // ----------------------------------------------------------
			//	input <- mg.observe.get.input
			//		input.mouse || input.point || input.string || input.cell
			//		input.token = 'mouse' || 'point' || 'string' || 'cell'
			//	input.tick = gameWindow.events.tick

			var cell = mg.action('get', input)
			if (cell.tick == input.tick) {
				break
			}
			cell.tick = input.tick

			var clear = true
			for (var i in mg.states) {
				if (cell[i]) {
					clear = false
					break
				}
			}

			for (var i in mg.directions) {}

			if (clear) {
				delete mg.cells[cell.string]
			} else {

			}

			break

		case 'shift': //------------------------------------------------------------
			//	input <- gameWindow

			var gw = input
			var off = mg.offset
			var ms = gw.mouse
			var cs = mg.cellSize
			var cw = mg.cellWidth

			ms.tick = gw.events.tick

			// key commands -----------------------------------

			for (var i in mg.modes) {
				if (gw.keys.hasUp[mg.modes[i].key] && mg.mode != i) {
					console.log(`mode set to '${mg.mode = i}'`)
				}
			}

			// mouse commands ---------------------------------
			ms.inMode = off < ms.x && ms.x < off + 2 * cs &&
				off < ms.y && ms.y < off + 2 * cs * mg.modeKeys.length

			if (ms.hasDown) {
				ms.state = !mg.observe('state', ms)
			}

			// if in the mode selector rectangle (mode rect)
			if (ms.inMode) {
				// get mode index and save it to gw.mouse
				ms.i = Math.floor((ms.y - off) / 2 / cs)

				// if the mouse is down in the mode rect
				//		set mg.mode to selected mode at index
				if (ms.isDown) {
					var md = mg.modeKeys[ms.i]
					if (mg.mode != md) {
						console.log(`mode set to '${mg.mode = md}'`)
					}
				}
			} else {
				// for observe('draw') : to draw mouse acurately
				mg.observe('get', ms)

				// if mouse is down, either pan or set the state of the selected cell
				if (ms.isDown) {
					if (mg.mode == 'pan') {
						pt.sume(mg.shift, pt.sub(ms, ms.prev))
					} else {
						ms.mode = mg.mode
						mg.action('state', ms)
					}
				}
			}

			break

		case 'status': //-----------------------------------------------------------

			//	input.id: socket.id
			//	input.string: <string>
			//	input[<state>]: true
			//	....

			input.token = 'string'
			input.cell = null
			var cell = mg.action('get', input)

			for (var i in mg.states) {
				cell[i] = input[i]
			}

			mg.action('update', input)

			break
	}

}
// ----------------------------------------
// Console Setup
// ----------------------------------------



try {
	module.exports = mg
} catch (e) {}
