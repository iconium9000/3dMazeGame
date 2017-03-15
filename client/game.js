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

function getString(input, inputType) {
	if (inputType == 'string') {
		return input
	} else if (inputType == 'mouse') {
		var p = mg.Cell.get(input)
		p.s = `${p.x},${p.y}`
		return p
	} else if (inputType == 'point') {
		var p = pt.copy(input)
		p.s = `${p.x},${p.y}`
		return p
	} else {
		console.log(`invalid token: ${inputType}`)
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
		'wire': {
			key: 'i',
			color: 'rgb(0,100,0)',
			draw: tempModeDraw('Wir')
		},
		'pad': {
			key: 'h',
			color: 'rgb(0,200,0)',
			draw: tempModeDraw('Pad')
		},
		'portal': {
			key: 'p',
			color: 'rgb(0,200,0)',
			draw: tempModeDraw('Prtl')
		},
	}
}
mg.modeKeys = Object.keys(mg.modes)
var Level = mg.Level = class {
	constructor() {
		this.cells = []
	}
	// input: <string/mouse/point>
	// inputType: 'string' or 'mouse' or 'point'
	// a1: 'add' or 'delete' or 'get'
	getCell(input, inputType, a1) {
		var o = getString(input, inputType)
		var c = this.cells[o.s]
		switch (a1) {
			case 'add':
				if (c == null) {
					return this.cells[o.s] = new mg.Cell(o, this)
				} else {
					return c
				}
			case 'delete':
				if (c != null) {
					delete this.cells[o.s]
				}
				return c
			case 'get':
				return this.cells[o.s]
		}
	}
	getState(input, inputType, mode) {
		var o = getString(input, inputType)
		var c = this.cells[o.s]
		return c == null ? false : c.state(mode)
	}
	// mode: 'pan' or 'space' or 'wall' or 'door' or 'wire' or 'pad' or 'portal'
	// input: <string/mouse/point>
	// inputType: 'string' or 'mouse' or 'point'
	// stateSet:
	action(mode, input, inputType, stateSet) {
		switch (mode) {
			case 'pan':
				if (input.isDown) {
					pt.sume(mg.shift, pt.sub(input, input.prev))
				}
				break
			case 'space':
				if (!input.isDown && !input.ups) {
					break
				}
				var c = this.getCell(input, inputType, stateSet ? 'add' : 'delete')
				if (c != null) {
					c.action(mode, stateSet)
				}
				break
			default:
				if (input.isDown || input.ups) {
					this.getCell(input, inputType, 'add').action(mode, stateSet)
				}
				break
		}
	}
	update(keyUps) {
		if (keyUps['u']) {}
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
	state(mode) {
		switch (mode) {
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
	getMode() {
		if (this.isWall) {
			return 'wall'
		} else if (this.isDoor) {
			return 'door'
		} else if (this.isWire) {
			return 'wire'
		} else if (this.isPad) {
			return 'pad'
		} else if (this.isPortal) {
			return 'portal'
		} else {
			return 'space'
		}
	}
	action(mode, stateSet) {
		switch (mode) {
			case 'space':
				if (stateSet) {
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
				this.isWall = stateSet
				this.isPad = false
				this.isPortal = false
				break
			case 'door':
				this.isDoor = stateSet
				this.isPad = false
				this.isPortal = false
				this.isWire = stateSet
				break
			case 'pad':
				this.isWire = this.isPad = stateSet
				this.isDoor = false
				this.isPortal = false
				this.isWall = false
				break
			case 'portal':
				this.isWire = this.isPortal = stateSet
				this.isDoor = false
				this.isPortal = false
				this.isWall = false
				break
		}
	}
	draw(g) {
		var p = pt.sum(pt.scale(this, mg.cellSize), mg.shift)
		g.fillStyle = mg.modes[this.getMode()].color
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
