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


var mg = {
	cellSize: 40,
	cellWidth: 35,
	shift: pt.zero(),
	states: {
		'space': {
			key: 'x'
		},
		'wire': {
			key: 'v',
		},
		'wall': {
			key: 'w',
		},
		'door': {
			key: 'd',
		},
		'pad': {
			key: 'a',
		},
		'portal': {
			key: 'z',
		}
	},
	cells: [],
	portals: []
}
// -----------------------------------------------------------------------------
// Observe
// -----------------------------------------------------------------------------
mg.observe = function (token, input) {
	switch (token) {
		case 'draw': // ------------------------------------------------------
			// draw spaces

			// draw walls

			// draw doors

			// draw wire stubs or pads

			// draw portals

			// draw wires

			// draw players

			// draw keys

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
	}
}
// -----------------------------------------------------------------------------
// Action
// -----------------------------------------------------------------------------
mg.action = function (token, input) {
	switch (token) {
		case 'pan':
			if (input.isDown) {
				pt.sume(mg.shift, pt.sub(input, input.prev))
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
			for (var i in mg.)

	}

}
// ----------------------------------------
// Console Setup
// ----------------------------------------



try {
	module.exports = mg
} catch (e) {}
