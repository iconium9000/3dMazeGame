console.log("game.js: init")
try {
	pt = require('./point.js')
	console.log('game.js: init point.js')
}
catch (e) {
	if (pt != null) {
		console.log('game.js: rcv point.js')
	}
	else {
		throw 'game.js: point.js not found'
	}
}

function getString(p) {
	return {
		s: `${p.x},${p.y}`,
		x: p.x,
		y: p.y,
		z: p.z
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
		'removeCell': {
			draw: function (g, i) {
				g.fillStyle = 'white'
				var cs = mg.cellSize
				g.fillText('Del', 5 + cs, 5 + cs * (1 + 2 * i))
			}
		},
		'addCell': {
			draw: function (g, i) {
				g.fillStyle = 'white'
				var cs = mg.cellSize
				g.fillText('NwC', 5 + cs, 5 + cs * (1 + 2 * i))
			}
		}
	}
}
mg.modeKeys = Object.keys(mg.modes)
var Level = mg.Level = class {
	constructor() {
		this.cells = []
	}
	action(cmd, input, parameter) {
		function getS() {
			if (parameter == 'string') {
				return input
			}
			else if (parameter == 'mouse') {
				return getString(mg.Cell.get(input))
			}
			else if (parameter == 'point') {
				return getString(input)
			}
			else {
				console.log(`invalid ${cmd} parameter: ${parameter}`)
			}
		}
		switch (cmd) {
			case 'pan':
				if (input.isDown) {
					pt.sume(mg.shift, pt.sub(input, input.prev))
				}
				break
			case 'removeCell':
				if (!input.isDown && !input.ups) {
					break
				}
				var s = getS().s
				if (this.cells[s]) {
					this.cells[s].kill()
					delete this.cells[s]
				}
				break
			case 'addCell':
				if (!input.isDown && !input.ups) {
					break
				}
				var o = getS()
				console.log('addCell')
				if (this.cells[o.s] == null) {
					this.cells[o.s] = new mg.Cell(o, this)
				}
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
		console.log('newCell: ' + getString(this).s)
	}
	kill() {
		console.log()
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
}
catch (e) {}
