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

function getString(input, a0) {
	if (a0 == 'string') {
		return input
	} else if (a0 == 'mouse') {
		var p = mg.Cell.get(input)
		p.s = `${p.x},${p.y}`
		return p
	} else if (a0 == 'point') {
		var p = pt.copy(input)
		p.s = `${p.x},${p.y}`
		return p
	} else {
		console.log(`invalid ${cmd} a0: ${a0}`)
	}
}
var mg = {
	shift: pt.zero(),
	cellSize: 20,
	cellWidth: 15,
	colors: {
		space: 'rgba(64, 64, 64, 0.3)',
		wall: 'rgb(128, 128, 128)',
	},
	mode: 'pan',
	modes: {
		'pan': {
			draw: function (g, i) {
				g.fillStyle = 'white'
				var cs = mg.cellSize
				g.fillText('Pan', 5 + cs, 5 + cs * (1 + 2 * i))
			}
		},
		'space': {
			draw: function (g, i) {
				g.fillStyle = 'white'
				var cs = mg.cellSize
				g.fillText('Spc', 5 + cs, 5 + cs * (1 + 2 * i))
			}
		},
		'wall': {
			draw: function (g, i) {
				g.fillStyle = 'white'
				var cs = mg.cellSize
				g.fillText('Wll', 5 + cs, 5 + cs * (1 + 2 * i))
			}
		}
	}
}
mg.modeKeys = Object.keys(mg.modes)
var Level = mg.Level = class {
	constructor() {
		this.cells = []
	}
	// input: <string/mouse/point>
	// a0: 'string' or 'mouse' or 'point'
	// a1: true (delete cell) or false (add cell)
	getCell(input, a0, a1) {
		var o = getString(input, a0)
		var c = this.cells[o.s]
		if ((c == null) == a1) {
			return c
		} else if (a1) {
			return this.cells[o.s] = new mg.Cell(o, this)
		} else {
			delete this.cells[o.s]
			return c
		}
	}
	state(cmd) {}
	// cmd: 'pan' or 'space' or 'wall' or 'door' or 'wire' or 'pad' or 'portal'
	// input: <string/mouse/point>
	// a0: 'string' or 'mouse' or 'point'
	// a1:
	action(cmd, input, a0, a1) {
		switch (cmd) {
			case 'pan':
				if (input.isDown) {
					pt.sume(mg.shift, pt.sub(input, input.prev))
				}
				break
			case 'space':
				if (!input.isDown && !input.ups) {
					break
				}
				var c = this.getCell(input, a0, !a1)
				if (c != null) {
					c.action(input, a1)
				}
				break
			case 'wall':
				if (!input.isDown && !input.ups) {
					break
				}
				var o = getString()
				var c = this.cells[o.s]
				if (c == null) {
					c = this.cells[o.s] = new mg.Cell(o, this)
				}
				c.action(cmd, a1)
				break
		}
	}
	draw(g) {
		for (var i in this.cells) {
			this.cells[i].draw(g)
		}
	}
}
mg.Cell = class {
	constructor(p, l) {
		this.x = p.x
		this.y = p.y
		this.z = p.z
		this.s = p.s
		this.level = l
		this.isWall = false
		this.isDoor = false
		this.isWire = false
		this.isPad = false
		this.isPortal = false
		console.log('newCell: ' + this.s)
	}
	state(cmd) {
		switch (cmd) {
			case 'space':
				return !(this.isWall || this.isDoor || this.isWire || this.isDoor || this.isPad || this.isPortal)
			case 'wall':
				return this.isWall
			case 'door':
				return this.isDoor
			case 'wire':
				return this.isWire
			case 'pad':
				return this.isPad
			case 'portal':
				return this.isPortal
		}
	}
	action(cmd, a0) {
		switch (cmd) {
			case 'space':
				if (a0) {
					this.isWall = false
					this.isDoor = false
					this.isWire = false
					this.isPad = false
					this.isPortal = false
				} else {
					console.log('kill: ' + this.s)
				}
				break
			case 'wall':
				this.isWall = a0
				this.isPad = false
				this.isPortal = false
				break
			case 'door':
				this.isDoor = a0
				this.isPad = false
				this.isPortal = false
				break
			case 'pad':
				this.isPad = a0
				this.isDoor = false
				this.isPortal = false
				this.isWall = false
				break
			case 'portal':
				this.isPortal = !this.isPad
		}
	}
	draw(g) {
		var p = pt.sum(pt.scale(this, mg.cellSize), mg.shift)
		g.fillStyle = mg.colors.space
		p.r = mg.cellWidth
		g.beginPath()
		g.rect(p.x, p.y, mg.cellWidth, mg.cellWidth)
		g.fill()
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
