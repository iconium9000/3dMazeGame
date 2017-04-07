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

function getSign(n) {
	return n > 0 ? 1 : n < 0 ? -1 : 0
}

function forEach(a, f) {
	for (var i in a) {
		f(a[i])
	}
}

function swap(v, a, b) {
	var t = v[a]
	v[a] = v[b]
	v[b] = t
}

//	-----------------------------------------------------------------------------
//	MazeGame
//	-----------------------------------------------------------------------------
var mg = {
	offset: 5,
	cellSize: 25,
	cellWidth: 18,
	wires: {},
	cells: {},
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
		'space': {
			color: '#404040',
			style: 'stroke',
			shape: 'drawRect',
			size: 'cellWidth',
			sizeFactor: 1 / 2
		},
		'level': {
			color: '#800080',
			style: 'stroke',
			shape: 'drawCircle',
			size: 'cellWidth',
			sizeFactor: 1 / 2
		},
		'wire': {
			color: {
				true: '#208000',
				false: '#802000'
			},
			style: 'stroke',
			shape: 'drawRect',
			size: 'cellWidth',
			sizeFactor: 1 / 5,
			foreach: `if (cell.rt) pt.drawLine(g,{a:ptm(cell),b:ptm(cell.rt)})
			if (cell.lf) pt.drawLine(g,{a:ptm(cell),b:ptm(cell.lf)})`
		},
		'door': {
			color: {
				true: '#008000',
				false: '#800000'
			},
			style: 'fill',
			shape: 'fillRect',
			size: 'cellSize',
			sizeFactor: 1 / 2
		},
		'pad': {
			color: {
				true: '#008000',
				false: '#800000'
			},
			style: 'fill',
			shape: 'square',
			size: 'cellWidth',
			sizeFactor: 1 / 3
		},
		'portal': {
			color: {
				true: '#800080',
				false: '#800040'
			},
			style: 'stroke',
			shape: 'square',
			size: 'cellSize',
			sizeFactor: 1 / 2,
			foreach: `if (cell.level) pt.drawLine(g,{a:ptm(cell),b:ptm(cell.level)})`
		},
		'player': {
			color: '#FFFFFF',
			style: 'stroke',
			shape: 'cross',
			size: 'cellSize',
			sizeFactor: 1 / 2,
			foreach: `if (cell == mg.player) pt.drawRect(g, cell.point)`
		},
		'key': {
			color: '#FFFFFF',
			style: 'stroke',
			shape: 'square',
			size: 'cellWidth',
			sizeFactor: 1 / 2,
		},
		'square': {}
	},
	modes: {
		'game': {
			key: 'g',
			str: 'gam',
		},
		'pan': {
			key: 'm',
			str: 'pan'
		},
		'space': {
			key: 'x',
			str: 'spc'
		},
		'level': {
			key: 'l',
			str: 'lvl'
		},
		'wire': {
			key: 'v',
			str: 'wir'
		},
		'door': {
			key: 'd',
			str: 'dor'
		},
		'pad': {
			key: 'a',
			str: 'pad'
		},
		'portal': {
			key: 'p',
			str: 'ptl'
		},
		'player': {
			key: 'j',
			str: 'plr'
		},
		'key': {
			key: 'k',
			str: 'key'
		},
		'square': {
			key: 's',
			str: 'sqr'
		}
	},
	init: function() {

	},
	cell: {
		mouseToPoint: function(mouse) {
			return pt.math(Math.round, pt.factor(pt.sub(input.mouse, mg.shift), mg.cellSize))
		},
		pointToMouse: function(point) {
			return pt.sum(mg.shift, pt.scale(cell, mg.cellSize))
		},
		observe: {
			mouse: function(mouse) {
				return mg.cell.action.point(mouseToPoint(mouse))
			},
			point: function(point) {
				return mg.cell.action.string(`${point.x},${point.y}`)
			},
			string: function(string) {
				return mg.cells[string]
			}
		},
		action: {
			mouse: function(mouse) {
				return mg.cell.action.point(mouseToPoint)
			},
			point: function(point) {
				return mg.cell.action.string(`${point.x},${point.y}`, point)
			},
			string: function(string, point) {
				if (mg.cells[string]) {
					return mg.cells[string]
				} else if (point) {
					return mg.cells[string] = pt.apply({
						string: string
					}, point)
				} else {
					var s = string.split(',')
					return mg.cells[string] = {
						string: string,
						x: parseFloat(s[0]),
						y: parseFloat(s[1]),
						z: 0
					}
				}
			}
		}
	},
	status: {
		observe: function(cell) {
			if (cell) {
				var status = {
					cell: true,
					string: cell.string,
					states: []
				}
				for (var i in mg.states) {
					if (cell[i]) {
						status.states.push(i)
					}
				}
				return status
			} else {

				var status = {
					all: true,
					states: {}
				}

				for (var i in mg.cells) {
					status.states[i] = mg.status.observe(mg.cells[i]).states
				}

				return status
			}
		},
		action: function(status) {
			if (!status) {
				console.log('failed to rcv status')
			} else if (status.cell) {
				var cell = mg.cell.action.string(status.string)

				for (var i in mg.states) {
					cell[status.states[i]] = true
				}
				for (var i in status.states) {
					cell[status.states[i]] = true
				}

				mg.update.action(cell)

			} else if (status.all) {
				for (var i in status.states) {
					mg.status.action({
						cell: true,
						string: i,
						states: status.states[i]
					})
				}
			}
		}
	},
	tick: function(gw) {

	}
}

//	----------------------------------------
//	Console Setup
//	----------------------------------------

try {
	module.exports = mg
} catch (e) {}
