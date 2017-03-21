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
		'wire': {

		},
		'space': {

		},
		'wall': {

		},
		'door': {

		},
		'pad': {

		},
		'portal': {

		}
	},
	modes: {
		'pan': {
			key: 'm',
			color: null,
			draw: tempModeDraw('Pan')
		},
		'wire': {
			key: 'i',
			color: 'rgb(100,100,0)',
			draw: tempModeDraw('Wir')
		},
		'space': {
			key: 'x',
			color: 'rgba(128, 128, 128, 0.75)',
			draw: tempModeDraw('Spc')
		},
		'wall': {
			key: 'w',
			color: 'rgba(255, 255, 255, 0.75)',
			draw: tempModeDraw('Wll')
		},
		'door': {
			key: 'd',
			color: 'rgba(0,255,0, 0.75)',
			draw: tempModeDraw('Dor')
		},
		'pad': {
			key: 'h',
			color: 'rgba(255,0,0, 0.5)',
			draw: tempModeDraw('Pad')
		},
		'portal': {
			key: 'p',
			color: 'rgba(255,0,255, 1)',
			draw: tempModeDraw('Prtl')
		},
		'key': {
			key: 'k',
			color: 'white',
			draw: tempModeDraw('key')
		},
		'player': {
			key: 'j',
			color: 'white',
			draw: tempModeDraw('plr')
		}
	}
}
mg.modeKeys = Object.keys(mg.modes)
var Level = mg.Level = class {
	constructor() {
		this.cells = []
		this.actions = []
		this.wires = []
		this.gates = []
		this.players = []
		this.keys = []
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

				for (var i in this.wires) {
					var w = this.wires[i]
					g.strokeStyle = 'green'
					pt.drawLine(g, {
						a: shift(w.a),
						b: shift(w.b)
					})
				}

				for (var i in this.cells) {
					var c = this.cells[i]

					var p = shift(c)

					for (var i in mg.states) {
						if (c[i]) {
							switch (i) {
								case 'wire':
									p.r = 2
									g.fillStyle = 'green'
									pt.fillRect(g, p)
									break
								case 'space':
									p.r = mg.cellWidth / 2
									g.fillStyle = mg.modes.space.color
									pt.fillRect(g, p)
									break
								case 'wall':
									p.r = mg.cellSize / 2
									g.fillStyle = mg.modes.wall.color
									pt.fillRect(g, p)
									break
								case 'door':
									p.r = mg.cellSize / 2
									g.fillStyle = mg.modes.door.color
									pt.fillRect(g, p)
									break
								case 'pad':
									p.r = mg.cellWidth / 2
									g.fillStyle = mg.modes.pad.color
									pt.fillRect(g, p)
									break
								case 'portal':
									p.r = mg.cellWidth / 2 + 1
									g.strokeStyle = mg.modes.portal.color
									pt.drawRect(g, p)
									break
							}
						}
					}
				}

				break
			case 'state':
				var c = this.cells[getString(input.inputType, input.input).s]
				if (input.state) {
					return c ? c[input.state] : false
				} else {
					return c ? c.get('state', null) : null
				}
		}
	}
	action(token, input) {
		switch (token) {
			case 'move':
				if (this.player) {
					if (this.player.cell.pad) {
						this.player.cell.player = null
						this.player.cell.gate.action('update')
					}


				}
				break
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
		switch (token) {
			case 'state':
				switch (input.mode) {
					case 'wire':
						if (input.state) {
							this.wire = true
							if (!this.wall && !this.door && !this.pad && !this.portal) {
								this.space = true
							}
						} else {
							this[this.door || this.wall ? 'wall' : 'space'] = true
							this.wire = this.door = this.pad = this.portal = false
						}
						break
					case 'space':
						if (input.state) {
							this.space = true
							this.wall = this.door = this.pad = this.portal = false
						} else if (this.space) {
							this.space = this.portal = this.wire = false
						}
						break
					case 'wall':
						if (input.state) {
							this.space = this.door = this.pad = this.portal = false
							this.wall = true
						} else if (this.wall) {
							if (this.wire) {
								this.space = true
							}
							this.wall = false
						}
						break
					case 'door':
					case 'pad':
					case 'portal':
						if (input.state) {
							for (var i in mg.states) {
								this[i] = i == 'wire' || i == input.mode || (i == 'space' && input.mode == 'portal')
							}
						} else if (this[input.mode]) {
							this[input.mode] = false
							this[input.mode == 'door' ? 'wall' : 'space'] = true
						}
						break
					case 'key':
						break
					case 'player':
						console.log('action(player)')
						break
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
							new mg.Gate(input.tick).spread(this[i] = {
								c: c,
								w: this.level.wires[p.s] = this.level.wires[p.s] || p
							})
							c.action('update', input)
						} else if (this[i]) {
							var l = this[i]
							delete this.level.wires[l.w.s]
							this[i] = null
							if (l.c.wire) {
								new mg.Gate(input.tick).spread(l)
							}
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
mg.Gate = class {
	constructor(tick) {
		this.tick = tick
		this.portals = []
		this.pads = []
	}
	action(token, input) {
		switch (token) {
			case 'spread':
				if (!input || input.w.gate == this || (input.w.gate && input.w.gate.tick == this.tick)) {
					return
				}
				input.c.gate = input.w.gate = this
				if (input.c.portal) {
					this.portals.push(input.c)
				} else if (input.c.pad) {
					this.pads.push(input.c)
				}
				for (var i in mg.directions) {
					this.action('spread', input.c[i])
				}
			case 'update':

		}
	}
	spread(p) {

	}
}
mg.Cell.get = function (p) {
	return pt.floor(pt.factor(pt.sub(p, mg.shift), mg.cellSize))
}
mg.Player = class {
	constructor(level, input) {
		level.players.push(this)
		this.level = level
		this.startCell = level.get('cell', input)
	}
	get() {

	}
	action(token, input) {
		switch (token) {
			case 'moveto':

			case 'movefrom':
			default:

		}
	}
}
mg.Key = class {
	constructor() {}
}
try {
	module.exports = mg
} catch (e) {}
