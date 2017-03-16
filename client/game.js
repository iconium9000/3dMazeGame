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
        var s = input.split(',')
        if (s.length != 2) {
            throw `invalid input ${input}`
        }
        var p = {
            x: parseFloat(s[0]),
            y: parseFloat(s[1]),
            z: 0
        }
        if (isNaN(p.x)) {
            throw `invalid floating point ${s[0]}`
        } else if (isNaN(p.y)) {
            throw `invalid floating point ${s[1]}`
        } else {

            return p
        }
    } else if (inputType == 'mouse') {
        var p = mg.Cell.get(input)
        p.s = `${p.x},${p.y}`
        return p
    } else if (inputType == 'point') {
        var p = pt.copy(input)
        p.s = `${p.x},${p.y}`
        return p
    } else {
        throw `invalid token: ${inputType}`
    }
}

function tempModeDraw(txt) {
    return function(g, i) {
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
    getStateToken: function(token, newSuperState, currentState) {
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
    }
    get(token, input) {
        switch (token) {
            case 'draw':
                for (var i in this.cells) {
                    this.cells[i].get('draw', input)
                }
                break
            case 'state':
                var c = this.cells[getString(input.input, input.inputType).s]
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
                    var o = getString(input.input, input.inputType)
                    var c = this.cells[o.s] = this.cells[o.s] || new mg.Cell(o, this)
                    c.action('state', input)
                    break
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
            case 'draw':
                var g = input
                var p = pt.sum(pt.scale(this, mg.cellSize), mg.shift)
                g.fillStyle = mg.modes[this.get('state')].color
                p.r = mg.cellWidth
                g.beginPath()
                g.rect(p.x, p.y, mg.cellWidth, mg.cellWidth)
                g.fill()
                break
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
                if (s == null) {
                    for (var i in mg.directions) {
                        console.log(i)
                    }
                    delete this.level.cells[this.s]
                }

                break
        }
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
