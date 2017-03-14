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

function getString(p) {
    return `${p.x},${p.y}`
}
var mg = {
    shift: pt.zero(),
    cellSize: 20,
    cellWidth: 15,
    mode: 'pan',
    modes: {
        'pan': {
            draw: function(g, i) {
                g.fillStyle = 'white'
                g.fillText('Pan', 5 + mg.cellSize, 5 + mg.cellSize * (1 + 2 * i))
            }
        },
        'removeCell': {
            draw: function(g, i) {
                g.fillStyle = 'white'
                g.fillText('Del', 5 + mg.cellSize, 5 + mg.cellSize * (1 + 2 * i))
            }
        },
        'newCell': {
            draw: function(g, i) {
                g.fillStyle = 'white'
                g.fillText('NwC', 5 + mg.cellSize, 5 + mg.cellSize * (1 + 2 * i))
            }
        }
    }
}
mg.modeKeys = Object.keys(mg.modes)
var Level = mg.Level = class {
    constructor() {
        this.cells = []
    }
    addCell(p) {
        p = mg.Cell.get(p)
        var s = getString(p)
        var c = this.cells[s]
        if (this.cells[s] == null) {
            c = this.cells[s] = new mg.Cell(p, this)
        }
    }
    removeCell(p) {
        p = mg.Cell.get(p)
        var s = getString(p)
        var c = this.cells[s]
        if (c) {
            console.log('remove ' + s)
            delete this.cells[s]
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
        this.z = 0
        this.level = l
        this.isWall = false
        this.isDoor = false
        this.isWire = false
        this.isPad = false
        this.isPortal = false
        console.log('newCell: ' + getString(this))
    }
    draw(g) {
        var p = pt.sum(pt.scale(this, mg.cellSize), mg.shift)
        g.strokeStyle = 'grey'
        p.r = mg.cellWidth
        g.beginPath()
        g.rect(p.x, p.y, mg.cellWidth, mg.cellWidth)
        g.fill()
    }
}
mg.Cell.get = function(p) {
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
