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

function isEqual(v) {
	for (var i = 1; i < arguments.length; ++i) {
		if (v == arguments[i]) {
			return true
		}
	}
	return false
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
	shift: pt.zero(),
	offset: 5,
	cellSize: 25,
	cellWidth: 18,
	all: {},
	cells: {},
	mode: 'game',
	clear: function() {
		cells = {}
		all = {}
		for (var i in mg.states) {
			all[i] = {}
		}
	},
	init: function(gw, idx) {
		for (var i in mg.states) {
			mg.all[i] = {}
		}

		var ptm = mg.cell.pointToMouse
		var mtp = mg.cell.mouseToPoint
		var g = gw.display.g

		mg.stateOrder.forEach(function(n) {
			var s = mg.states[n]
			var drawOrFill = s.style == 'stroke' ? 'draw' : 'fill'
			eval(`s.draw = function(cell){
					${s.drawIf ? `if (!(${s.drawIf})) return`	: ''}
					cell.mouse = ptm(cell)
					cell.mouse.r = mg.${s.size} / ${s.sizeFactor}
					g.${s.style}Style = ${s.color[true] ? `s.color[cell.gate.open]`: `s.color`}
					${s.shape == 'cross' ?
						`var x = pt.zero(), y = pt.zero()
						x.x = y.y = cell.mouse.r
						pt.drawLine(g,{a: pt.sum(cell.mouse, x), b: pt.sub(cell.mouse, x)})
						pt.drawLine(g,{a: pt.sum(cell.mouse, y), b: pt.sub(cell.mouse, y)})` :
						`pt${s.shape == 'square' ?
					 		`[cell.square ? '${drawOrFill}Rect' : '${drawOrFill}Circle']` :
							`.${s.shape}`
						}(g, cell.mouse)`}
					${s.foreach || ''}
				}`)
		})

		eval(`mg.state.observe = function(cell, state) {
			switch(state) {
				${function() {
					var str = ''
					for (var i in mg.states) {
						var s = mg.states[i]
						if (s.get) {
							str += `case '${i}':
							${s.get}`
						}
					}
					return str
				}()}
				default:
					return !(cell && cell[state])
			}
		}`)

		eval(`mg.state.action = function(cell, state, addOrRemove) {
			switch(state){
				${function() {
					var str = ''
					for (var i in mg.states) {
						var s = mg.states[i]
						str += `case '${i}':
						if (addOrRemove) {
							${s.add}
						} else {
							${s.remove}
						}
						break
						`
					}
					return str
				}()}
			}
			mg.update(cell)
		}`)

	},
	tick: function(gw, idx) {
		var ms = gw.mouse
		var g = gw.display.g

		if (ms.isDown && isEqual(mg.mode, 'pan', 'game')) {
			pt.sume(mg.shift, pt.sub(ms, ms.prev))
		}

		ms.point = mg.cell.mouseToPoint(ms)

		for (var i in mg.stateOrder) {
			var n = mg.stateOrder[i]
			var s = mg.states[n]
			forEach(mg.all[n], s.draw)
		}

		for (var i in mg.modes) {
			var m = mg.modes[i]
			var s = mg.states[i]

			if (gw.keys.hasDown[m.key] && mg.mode != i) {
				mg.mode = i
				console.log(`set mode to '${i}'`)
			}
		}

		if (mg.mode == 'game') {
			if (gw.keys.hasDown[' ']) {

			}
		} else if (mg.states[mg.mode] && (ms.hasDown || ms.isDown)) {
			var cell = mg.cell.action.point(ms.point)
			if (ms.hasDown) {
				mg.state.set = mg.state.observe(cell, mg.mode)
			}
			mg.state.action(cell, mg.mode, mg.state.set)
			idx.action.status(cell)
		}

		g.strokeStyle = g.fillStyle = 'white'
		ms.r = 10
		pt.fillCircle(g, ms)
		pt.drawRect(g, pt.apply({
			r: ms.r
		}, mg.cell.pointToMouse(ms.point)))

		mg.check()
	},
	cell: {
		mouseToPoint: function(mouse) {
			return pt.math(Math.round, pt.factor(pt.sub(mouse, mg.shift), mg.cellSize))
		},
		pointToMouse: function(point) {
			return pt.sum(mg.shift, pt.scale(point, mg.cellSize))
		},
		observe: {
			mouse: function(mouse) {
				return mg.cell.observe.point(mg.cell.mouseToPoint(mouse))
			},
			point: function(point) {
				return mg.cell.observe.string(`${point.x},${point.y}`, point)
			},
			string: function(string, point) {
				return mg.cells[string]
			}
		},
		action: {
			mouse: function(mouse) {
				return mg.cell.action.point(mg.cell.mouseToPoint(mouse))
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
	state: {
		observe: null,
		action: null
	},
	check: function() {
		for (var i in mg.all.wire) {
			mg.all.wire[i].gate.open = true
		}
		for (var i in mg.all.pad) {
			var c = mg.cells[i]
			if (!c.player && !c.key) {
				c.gate.open = false
			}
		}
		mg.numPortals = 0
		// TODO PORTAL LOGIC
		for (var i in mg.all.portal) {
			mg.numPortals += mg.cells[i].gate.open
		}
		if (mg.numPortals > 2) {
			for (var i in mg.all.portal) {
				mg.cells[i].gate.open = false
			}
		}
	},
	gate: function(cell, gate) {
		if (cell && cell.wire && (!gate || cell.gate != gate)) {
			cell.gate = gate || {
				open: true,
				pad: []
			}
			if (cell.pad) {
				cell.gate.pad.push(cell)
			}
			for (var i in mg.directions) {
				mg.gate(cell[i], cell.gate)
			}
		}
	},
	update: function(cell, layer) {
		cell.clear = true

		for (var i in mg.states) {
			cell.clear = cell.clear && !cell[i]
			if (cell[i]) {
				mg.all[i][cell.string] = cell
			} else {
				delete mg.all[i][cell.string]
			}
		}

		if (cell == mg.player && !cell.player) {
			mg.player = null
		} else if (cell.player) {
			mg.player = cell
		}

		if (cell.clear) {
			delete mg.cells[cell.string]
		}

		for (var i in mg.directions) {
			cell[i] = mg.cell.observe.point(pt.sum(cell, mg.directions[i]))
			if (cell[i] && !layer) {
				mg.update(cell[i], true)
			}
		}

		if (!layer && !cell.clear) {
			mg.gate(cell)
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
					if (cell[i] == true) {
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
					cell[i] = false
				}
				for (var i in status.states) {
					cell[status.states[i]] = true
				}

				mg.update(cell)

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
	stateOrder: ['space', 'wall', 'door', 'wire', 'portal', 'level', 'pad', 'key', 'player'],
	states: {
		'space': {
			color: '#404040',
			style: 'stroke',
			shape: 'drawRect',
			size: 'cellWidth',
			sizeFactor: 2,
			add: `cell.space = true, cell.wall = cell.door = false`,
			remove: `cell.space = cell.pad = cell.key = cell.square = false
				if (!cell.level) cell.player = cell.portal = false`
		},
		'level': {
			color: '#808000',
			style: 'stroke',
			shape: 'drawCircle',
			size: 'cellWidth',
			sizeFactor: 2,
			drawIf: `cell.level == true && isEqual(mg.mode, 'level', 'portal', 'player')`,
			get: `if (cell) {

			} else {
				return true
			}`,
			add: `cell.level = true`,
			remove: `cell.level = false`,
			foreach: `if (mg.level == cell)
				cell.mouse.r /= 2, pt.drawCircle(g, cell.mouse)
				for (var i in cell.portal)
					pt.drawLine(g, {a: cell.mouse,b: ptm(cell.portal[i])})
				for (var i in cell.player)
					pt.drawLine(g, {a: cell.mouse,b: ptm(cell.player[i])})`
		},
		'wall': {
			color: '#808080',
			style: 'fill',
			shape: 'fillRect',
			size: 'cellSize',
			sizeFactor: 2,
			add: `cell.wall = true
				cell.space = cell.pad = cell.portal = cell.player = cell.key = cell.square = false `,
			remove: `cell.wall = false `
		},
		'wire': {
			color: {
				true: '#408000',
				false: '#804000'
			},
			style: 'stroke',
			shape: 'drawRect',
			size: 'cellWidth',
			sizeFactor: 6,
			foreach: `if (cell.rt && cell.rt.wire)
					pt.drawLine(g, {
						a: ptm(cell),
						b: ptm(cell.rt)
					})
				if (cell.dn && cell.dn.wire)
					pt.drawLine(g, {
						a: cell.mouse,
						b: ptm(cell.dn)
					})`,
			add: `cell.wire = true `,
			remove: `cell.wire = cell.door = cell.pad = cell.portal = false`
		},
		'door': {
			color: {
				true: '#208000',
				false: '#802000'
			},
			style: 'fill',
			shape: 'fillRect',
			size: 'cellSize',
			sizeFactor: 2,
			add: `cell.door = cell.wire = true
				cell.wall = cell.space = cell.pad = cell.portal = cell.player = cell.key = cell.square = false`,
			remove: `cell.door = false`
		},
		'pad': {
			color: {
				true: '#208000',
				false: '#802000'
			},
			style: 'fill',
			shape: 'square',
			size: 'cellWidth',
			sizeFactor: 3,
			add: `cell.pad = cell.wire = cell.space = true
				cell.wall = cell.door = cell.portal = false `,
			remove: `cell.pad = false,
				cell.square = cell.square && cell.key`
		},
		'portal': {
			color: {
				true: '#800080',
				false: '#800000'
			},
			style: 'stroke',
			shape: 'drawRect',
			size: 'cellSize',
			sizeFactor: 2,
			drawIf: `
				cell.portal == true `,
			foreach: `if (cell.level && (mg.mode == 'mode' || mg.mode == 'level'))
					pt.drawLine(g, {
						a: cell.mouse,
						b: ptm(cell.level)
					})`,
			add: `cell.portal = cell.wire = cell.space = true
				if (cell.level = mg.level) mg.level.portal[cell.string] = cell
				cell.wall = cell.door = cell.pad = cell.player = cell.key = cell.square = false `,
			remove: `cell.portal = false
				if (cell.level) delete cell.level.portal[cell.string]
				cell.level = false`
		},
		'player': {
			drawIf: `cell.player == true`,
			color: '#FFFFFF',
			style: 'stroke',
			shape: 'cross',
			size: 'cellSize',
			sizeFactor: 2,
			foreach: `if (cell == mg.player)
					pt.drawRect(g, cell.mouse)`,
			add: `cell.player = cell.space = true
				if (cell.level = mg.level) mg.level.player[cell.string] = cell
				cell.wall = cell.door = cell.portal = false `,
			remove: `cell.player = false
				if (cell.level) delete cell.level.player[cell.string]
				cell.level = false`
		},
		'key': {
			color: '#FFFFFF',
			style: 'stroke',
			shape: 'square',
			size: 'cellWidth',
			sizeFactor: 2,
			add: `cell.key = cell.space = true
				cell.wall = cell.door = cell.portal = false `,
			remove: `cell.key = false,
				cell.square = cell.square && cell.pad `
		},
		'square': {
			add: `cell.square = cell.key || cell.pad `,
			remove: `cell.square = false `
		}
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
		'wall': {
			key: 'w',
			str: 'wal'
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
	}
}

//	----------------------------------------
//	Console Setup
//	----------------------------------------

try {
	module.exports = mg
	for (var i in mg.states) {
		mg.all[i] = {}
	}
} catch (e) {}
