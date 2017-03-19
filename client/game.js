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

function getString(token, input) {
	switch (token) {
		case 'pair':
			var a = input.a
			var b = input.b
			switch (a.x > b.x ? 1 : b.x > a.x ? -1 : a.y > b.y ? 1 : b.y > a.y ? -1 : 0) {
				case 1:
					return {
						a: a,
						b: b,
						s: `[${a.s}],[${b.s}]`
					}
				case -1:
					return {
						a: b,
						b: a,
						s: `[${b.s}],[${a.s}]`
					}
				case 0:
					throw `getString('pair') Points are equal: [${a.s}],[${b.s}]`
			}
		case 'string':
			var s = input.split(',')
			if (s.length != 2) {
				throw `getString('string') invalid input '${input}'`
			}
			var p = {
				x: parseFloat(s[0]),
				y: parseFloat(s[1]),
				z: 0
			}
			if (isNaN(p.x)) {
				throw `getString('string') invalid floating point '${s[0]}'`
			} else if (isNaN(p.y)) {
				throw `getString('string') invalid floating point '${s[1]}'`
			} else {
				return p
			}
		case 'mouse':
			var p = mg.Cell.get(input)
			p.s = `${p.x},${p.y}`
			return p
		case 'point':
			var p = pt.copy(input)
			p.s = `${p.x},${p.y}`
			return p
		default:
			throw `getString invalid token: '${token}'`
	}
}

function tempModeDraw(txt) {
	return function (g, i) {
		g.fillStyle = 'white'
		g.textAlign = 'center'
		var cs = mg.cellSize
		g.fillText(txt, 5 + cs, 5 + cs * (1 + 2 * i))
	}
}
var mg = {
	shift: pt.zero(),
	cellSize: 20,
	cellWidth: 15,
	mode: 'pan',
	directions: {
		'up': {
			x: 0,
			y: -1,
			z: 0
		},
		'dn': {
			x: 0,
			y: 1,
			z: 0
		},
		'rt': {
			x: 1,
			y: 0,
			z: 0
		},
		'lf': {
			x: -1,
			y: 0,
			z: 0
		},
	},
	getStateToken: function (token, newSuperState, currentState) {
		switch (token[newSuperState ? 0 : 1]) {
			case 't':
				return true
			case 'f':
				return false
			case 'o':
				if (currentState == null) {
					return false
				} else {
					return currentState
				}
		}
	},
	states: {
		'space': {
			'space': 'tf',
			'wall': 'fo',
			'door': 'fo',
			'pad': 'fo',
			'portal': 'fo',
			'wire': 'fo'
		},
		'wall': {
			'space': 'fo',
			'wall': 'tf',
			'door': 'fo',
			'pad': 'fo',
			'portal': 'fo',
			'wire': 'oo'
		},
		'door': {
			'space': 'fo',
			'wall': 'fo',
			'door': 'tf',
			'pad': 'fo',
			'portal': 'fo',
			'wire': 'to'
		},
		'pad': {
			'space': 'fo',
			'wall': 'fo',
			'door': 'fo',
			'pad': 'tf',
			'portal': 'fo',
			'wire': 'to'
		},
		'portal': {
			'space': 'fo',
			'wall': 'fo',
			'door': 'fo',
			'pad': 'fo',
			'portal': 'tf',
			'wire': 'to'
		},
		'wire': {
			'space': 'fo',
			'wall': 'oo',
			'door': 'of',
			'pad': 'of',
			'portal': 'of',
			'wire': 'tf'
		},
	},
	modes: {
		'pan': {
			key: 'm',
			color: null,
			draw: tempModeDraw('Pan')
		},
		'space': {
			key: 'x',
			color: 'rgba(64, 64, 64, 0.3)',
			draw: tempModeDraw('Spc')
		},
		'wall': {
			key: 'w',
			color: 'rgb(128, 128, 128)',
			draw: tempModeDraw('Wll')
		},
		'door': {
			key: 'd',
			color: 'rgb(0,200,0)',
			draw: tempModeDraw('Dor')
		},
		'pad': {
			key: 'h',
			color: 'rgb(100,0,0)',
			draw: tempModeDraw('Pad')
		},
		'portal': {
			key: 'p',
			color: 'rgb(100,0,100)',
			draw: tempModeDraw('Prtl')
		},
		'wire': {
			key: 'i',
			color: 'rgb(100,100,0)',
			draw: tempModeDraw('Wir')
		}
	}
}
mg.modeKeys = Object.keys(mg.modes)
var Level = mg.Level = class {
	constructor() {
		this.cells = []
		this.actions = []
		this.wires = []
		this.portals = []
		this.gates = []
	}
	get(token, input) {
		switch (token) {
			case 'cell':
				return this.cells[getString(input.inputType, input.input).s]
			case 'draw':
				var g = input

				function shift(p) {
					return pt.sum(mg.shift, pt.scale(p, mg.cellSize))
				}

				for (var i in this.cells) {
					var c = this.cells[i]
					var p = shift(c)
					g.fillStyle = mg.modes[c.get('state')].color
					p.r = mg.cellWidth
					g.beginPath()
					g.rect(p.x - mg.cellWidth / 2, p.y - mg.cellWidth / 2, mg.cellWidth, mg.cellWidth)
					g.fill()
				}
				for (var i in this.wires) {
					var w = this.wires[i]
					pt.drawLine(g, {
						a: shift(w.a),
						b: shift(w.b)
					})
				}
				break
			case 'state':
				var c = this.cells[getString(input.inputType, input.input).s]
				if (input.state) {
					return c ? c[input.state] : false
				} else {
					if (c) {
						console.log('state: ' + c.get('state', null))
					} else {
						console.log("no c found")
					}
					return c ? c.get('state', null) : null
				}
		}
	}
	action(token, input) {
		switch (token) {
			case 'clear':
				this.cells = []
				break
			case 'pan':
				if (input.isDown) {
					pt.sume(mg.shift, pt.sub(input, input.prev))
				}
				return
			case 'state':
				// input: {input, inputType(), mode(mg.mode), state(bool)}
				if (input.input.isDown || input.input.ups) {
					var o = getString(input.inputType, input.input)
					var c = this.cells[o.s]
					if (c || input.state) {
						if (c == null) {
							c = this.cells[o.s] = new mg.Cell(o, this)
						}
						c.action('state', input)
						break
					} else {
						return
					}
				} else {
					return
				}
			case 'update':
				break
		}
	}
}
mg.Cell = class {
	constructor(p, l) {
		this.x = p.x
		this.y = p.y
		this.z = p.z
		this.s = p.s
		this.tick = null
		this.level = l
		// console.log('newCell: ' + this.s)
	}
	get(token, input) {
		switch (token) {
			case 'state':
				if (input) {
					return this[input]
				} else {
					for (var i in mg.states) {
						if (this[i]) {
							return i
						}
					}
					return null
				}
		}
	}
	action(token, input) {
		console.log(`[${this.s}].action('${token}')`)
		switch (token) {
			case 'state':
				var sc = mg.states[input.mode]
				for (var i in sc) {
					this[i] = mg.getStateToken(sc[i], input.state, this[i])
				}
			case 'update':
				if (this.tick == input.tick) {
					return
				}
				this.tick = input.tick
				var s = this.get('state')
				if (s) {
					for (var i in mg.directions) {
						var c = this.level.get('cell', {
							input: pt.sum(this, mg.directions[i]),
							inputType: 'point'
						})
						if (c && this.wire && c.wire) {
							var p = getString('pair', {
								a: this,
								b: c
							})
							this[i] = {
								c: c,
								w: this.level.wires[p.s] = this.level.wires[p.s] || p
							}
							c.action('update', input)
						} else if (this[i]) {
							var l = this[i]
							delete this.level.wires[l.w.s]
							this[i] = null
						}
					}
				} else {
					delete this.level.cells[this.s]
					for (var i in mg.directions) {
						if (this[i]) {
							this[i].c.action('update', input)
						}
					}
				}
				break
		}
	}
}
mg.Cell.get = function (p) {
	return pt.floor(pt.factor(pt.sub(p, mg.shift), mg.cellSize))
}
mg.Player = class {
	constructor() {}
}
mg.Player = class {
	constructor() {}
}
mg.Gate = class {
	constructor() {}
}
try {
	module.exports = mg
} catch (e) {}
