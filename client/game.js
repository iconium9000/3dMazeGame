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

// -----------------------------------------------------------------------------
// MazeGame
// -----------------------------------------------------------------------------
var mg = {
	offset: 5,
	cellSize: 30,
	cellWidth: 25,
	shift: pt.zero(),
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
			str: 'spc'
			key: 'x'
		},
		'wire': {
			str: 'wir'
			key: 'v',
		},
		'wall': {
			str: 'wll'
			key: 'w',
		},
		'door': {
			str: 'dor'
			key: 'd',
		},
		'pad': {
			str: 'pad'
			key: 'a',
		},
		'portal': {
			str: 'ptl'
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
	},
	cells: [],
	portals: []
}
mg.modeKeys = Object.keys(mg.modes)
// -----------------------------------------------------------------------------
// Observe
// -----------------------------------------------------------------------------
mg.observe = function (token, input) {
	switch (token) {
		case 'draw': // ------------------------------------------------------------
			var g = input.display.g
			var w = input.display.width
			var h = input.display.height
			var cs = mg.cellSize
			var cw = mg.cellWidth

			function shift(p) {
				return pt.sum(mg.shift, pt.scale(p, cs))
			}

			var c = shift(pt.zero())
			c.r = 10
			g.fillStyle = 'white'
			pt.fillCircle(g, c)

			// draw spaces ---------------------------------------

			// draw walls ----------------------------------------

			// draw doors ----------------------------------------

			// draw wire stubs or pads ---------------------------

			// draw portals --------------------------------------

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

			input.mouse.r = 10
			pt.fillCircle(g, input.mouse)

			if (input.mouse.inMode) {
				g.beginPath()
				g.rect(off + cs - cw / 2, off + cs - cw / 2 + 2 * cs * input.mouse.i, cw, cw)
				g.stroke()
			}

			break

		case 'get': // -------------------------------------------------------------
			// input: {token:'mouse', mouse:{x,y,z}}
			// 		get cell relative to shift
			// input: {token: 'point', point:{x,y,z}}
			//		get cell in cell array at point
			// input: {token: 'string', string:'<x-cord>,<y-cord>'}
			//		get cell in cell array at string's index
			// input: {token: 'cell', cell: <cell at string>}
			// 		get cell in input
			console.log(`observe('get',token:${token})`)
			switch (input.token) {
				case 'mouse':
					input.point = pt.floor(pt.factor(pt.sub(input.mouse, mg.shift), mg.cellSize))

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

			return null

		case 'state': // ----------------------------------------------------------
			var cell = mg.observe('get', input)
			return cell && cell[input.mode]
	}
}
// -----------------------------------------------------------------------------
// Action
// -----------------------------------------------------------------------------
mg.action = function (token, input) {
	switch (token) {
		case 'shift': //------------------------------------------------------------
			var gw = input
			var off = mg.offset
			var ms = gw.mouse
			var cs = mg.cellSize
			var cw = mg.cellWidth

			// key commands -----------------------------------

			for (var i in mg.modes) {
				if (gw.keys.hasUp[mg.modes[i].key]) {

				}

			}

			// mouse commands ---------------------------------
			ms.inMode = off < ms.x && ms.x < off + 2 * cs &&
				off < ms.y && ms.y < off + 2 * cs * mg.modeKeys.length

			if (ms.inMode) {
				ms.i = Math.floor((ms.y - off) / 2 / cs)
				if (ms.isDown) {
					var md = mg.modeKeys[ms.i]
					if (mg.mode != md) {
						console.log(`mode set to '${mg.mode = md}'`)
					}
				}
			} else if (ms.isDown) {
				if (mg.mode == 'pan') {
					pt.sume(mg.shift, pt.sub(ms, ms.prev))
				} else {
					var m = pt.sum(mg.shift, pt.scale(pt.floor(pt.factor(pt.sub(ms, mg.shift), cs))))

				}
			}

			break

		case 'get': // -------------------------------------------------------------
			return input.cell = input.cell || mg.observe('get', input) || (mg.cells[input.string] = {
				x: input.point.x,
				y: input.point.y,
				z: 0,
				s: input.string
			})

		case 'state': // -----------------------------------------------------------
			var cell = mg.action('get', input)
			if (input.state || cell[input.mode]) {
				switch (input.mode) {
					case 'space': //--------------------
						if (input.state) {
							cell.space = true
							cell.wall = cell.door = cell.portal = cell.pad = false
						} else if (!cell.wall && !cell.door) {
							cell.space = cell.wire = cell.pad = cell.portal = false
						}
						break

					case 'wire': //---------------------
						if (input.state) {
							cell.wire = true
							if (!cell.wall && !cell.door) {
								cell.space = true
							}
						} else {
							if (cell.door) {
								cell.wall = true
							}
							cell.wire = cell.door = cell.portal = cell.pad = false
						}
						break

					case 'wall': //---------------------
						cell.wall = input.state
						if (input.state) {
							cell.space = cell.door = cell.portal = cell.pad = false
						} else if (cell.wire) {
							cell.space = true
						}
						break

					case 'door': //---------------------
						cell.door = input.state
						if (input.state) {
							cell.wire = true
							cell.wall = cell.portal = cell.pad = false
						} else {
							cell.wall = true
						}
						break

					case 'portal': //--------------------
						cell.portal = input.state
						if (input.state) {
							cell.space = cell.wire = true
							cell.wall = cell.door = cell.pad = false
						}
						break

					case 'pad': //----------------------
						cell.pad = input.state
						if (input.state) {
							cell.space = cell.wire = true
							cell.wall = cell.door = cell.portal = false
						}
						break

				}
			}
		case 'update': // ----------------------------------------------------------
			var cell = input.cell || mg.action('get', input)

			var clear = true
			for (var i in mg.states) {
				if (cell[i]) {
					clear = false
					break
				}
			}

			if (clear) {

			} else {

			}

	}

}
// ----------------------------------------
// Console Setup
// ----------------------------------------



try {
	module.exports = mg
} catch (e) {}
