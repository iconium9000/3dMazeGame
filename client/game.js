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
    modes: {
        'shift': {
            order: 0,
            draw: function(g, i) {
                g.strokeStyle = 'white'
                var y = mg.cellSize * (1 + 2 * i)
                pt.drawLine(g, {
                    a: {
                        x: 5 + mg.cellSize - mg.cellWidth / 2,
                        y: 5 + y
                    },
                    b: {
                        x: 5 + mg.cellSize + mg.cellWidth / 2,
                        y: 5 + y
                    }
                })
                pt.drawLine(g, {
                    a: {
                        x: 5 + mg.cellSize,
                        y: 5 + y - mg.cellWidth / 2
                    },
                    b: {
                        x: 5 + mg.cellSize,
                        y: 5 + y + mg.cellWidth / 2
                    }
                })
            }
        },
        'newCell': {
            order: 1,
            draw: function(g, i) {
                var y = mg.cellSize * (1 + 2 * i)

            }
        }
    }
}
mg.mode = mg.modes['shift']

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
        g.strokeStyle = 'white'
        g.rect(p.x, p.y, mg.cellWidth, mg.cellWidth)
        g.stroke()
    }
}
mg.Cell.get = function(p) {
    return pt.floor(pt.factor(pt.sub(p, mg.shift), mg.cellSize))
}
mg.Player = class {
    constructor() {

    }
}
mg.Player = class {
    constructor() {

    }
}
mg.Gate = class {
    constructor() {

    }
}

try {
    module.exports = mg
} catch (e) {}
