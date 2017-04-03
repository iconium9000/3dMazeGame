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
    cells: {},
    all: {},
    wires: {},
    status: null,
    shift: pt.zero(),

    Cell: class Cell {
        constructor(input) {
            this.x = input.point.x
            this.y = input.point.y
            this.z = input.point.z
            this.string = input.string
        }
    }
    ,
    Wire: class Wire {
        constructor(input) {
            this.a = input.a
            this.b = input.b
            this.string = input.string
        }
    }
    ,
    Gate: class Gate {
        constructor(input) {
            this.portals = []
            this.pads = []
            this.open = true
        }
    }
    ,
    Link: class Link {
        constructor(input) {
            this.cell = input.cell
            this.wire = input.wire
        }
    }
    ,
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
        'level': {},
        'space': {},
        'wire': {},
        'wall': {},
        'door': {},
        'pad': {},
        'portal': {},
        'player': {},
        'key': {},
        'square': {}
    },
    mode: 'game',
    modes: {
        'game': {
            str: 'gam',
            key: 'g'
        },
        'pan': {
            str: 'pan',
            key: 'e'
        },
        'level': {
            str: 'lvl',
            key: 'q'
        },
        'space': {
            str: 'spc',
            key: 'x'
        },
        'wire': {
            str: 'wir',
            key: 'v',
        },
        'wall': {
            str: 'wll',
            key: 'w',
        },
        'door': {
            str: 'dor',
            key: 'd',
        },
        'pad': {
            str: 'pad',
            key: 'a',
        },
        'portal': {
            str: 'ptl',
            key: 'z',
        },
        'player': {
            str: 'plr',
            key: 'c'
        },
        'key': {
            str: 'key',
            key: 'f'
        },
        'square': {
            str: 'sqr',
            key: 's'
        }
    }
}
mg.modeKeys = Object.keys(mg.modes)

for (var i in mg.states) {
    mg.all[i] = new Object
}

mg.setStates = function(e) {
    var g = e.display.g
    var cw = mg.cellWidth
    var cs = mg.cellSize

    function draw(g, f, w, r, oncolor, offcolor) {
        var d, x, y
        var ptf = f == 'stroke' ? 'draw' : f
        if (w == 'Cross') {
            x = pt.zero()
            y = pt.zero()
            x.x = y.y = r
            d = `pt.drawLine(g,{a:pt.sum(p,x),b:pt.sub(p,x)})
			pt.drawLine(g,{a:pt.sum(p,y),b:pt.sub(p,y)})`
        } else if (w == 'Square') {
            d = `p.r = r; pt[cell.square ? '${ptf}Rect' : '${ptf}Circle'](g, p)`
        } else {
            d = `p.r = r; pt.${ptf}${w}(g, p)`
        }

        eval(`var ans = function(cell){
			var p = pt.sum(mg.shift, pt.scale(cell, mg.cellSize))
			g.${f}Style = ${offcolor ? 'cell.gate.open ? oncolor : offcolor' : 'oncolor'}
			${d}
			return p
			}`)

        return ans
    }

    mg.states.level.draw = draw(g, 'stroke', 'Circle', cs / 2, '#808020')
    mg.states.level.drawSelected = draw(g, 'stroke', 'Circle', cs / 4, '#808020')
    mg.states.space.draw = draw(g, 'stroke', 'Rect', cw / 2, '#404040')
    mg.states.wire.draw = draw(g, 'stroke', 'Rect', cw / 6, '#408000', '#804000')
    mg.states.wall.draw = draw(g, 'fill', 'Rect', cs / 2, '#808080')
    mg.states.door.draw = draw(g, 'fill', 'Rect', cs / 2, '#208000', '#802000')
    mg.states.pad.draw = draw(g, 'fill', 'Square', cw / 3, '#208000', '#802000')
    mg.states.portal.draw = draw(g, 'stroke', 'Rect', cs / 2, '#800080', '#800000')
    mg.states.player.draw = draw(g, 'stroke', 'Cross', cs / 2, '#FFFFFF')
    mg.states.player.drawSelected = draw(g, 'stroke', 'Rect', cs / 2, '#FFFFFF')
    mg.states.key.draw = draw(g, 'stroke', 'Square', cw / 2, '#FFFFFF')
}

//	-----------------------------------------------------------------------------
//	Observe
//	-----------------------------------------------------------------------------
mg.observe = {
    'draw': //	------------------------------------------------------------
    function(input) {
        //	input <- gameWindow

        var g = input.display.g
        var width = input.display.width
        var height = input.display.height
        var ms = input.mouse
        var cs = mg.cellSize
        var cw = mg.cellWidth
        var shf = mg.shift

        function shift(p) {
            return pt.sum(shf, pt.scale(p, cs))
        }

        //	draw spaces ---------------------------------------
        forEach(mg.all.space, mg.states.space.draw)

        //	draw walls ----------------------------------------
        forEach(mg.all.wall, mg.states.wall.draw)

        //	draw doors ----------------------------------------
        forEach(mg.all.door, mg.states.door.draw)

        //	draw wire stubs or pads ---------------------------
        forEach(mg.all.wire, mg.states.wire.draw)
        forEach(mg.all.pad, mg.states.pad.draw)

        //	draw portals --------------------------------------
        forEach(mg.all.portal, mg.states.portal.draw)

        //	draw wires ----------------------------------------
        for (var i in mg.wires) {
            var wire = mg.wires[i]

            g.strokeStyle = wire.gate.open ? '#408000' : '#804000'
            pt.drawLine(g, {
                a: pt.sum(mg.shift, pt.scale(wire.a, mg.cellSize)),
                b: pt.sum(mg.shift, pt.scale(wire.b, mg.cellSize))
            })

        }

        //	draw players --------------------------------------
        forEach(mg.all.player, mg.states.player.draw)
        if (mg.player) {
            mg.states.player.drawSelected(mg.player)
        }

        //	draw keys -----------------------------------------
        forEach(mg.all.key, mg.states.key.draw)

        //	draw levels ---------------------------------------
        if (mg.mode == 'level' || mg.mode == 'portal') {
            if (mg.level) {
                mg.states.level.drawSelected(mg.level)
            }
            for (var i in mg.all.level) {
                var l = mg.all.level[i]
                l.point = mg.states.level.draw(l)

                for (var j in l.portals) {
                    var p = l.portals[j]

                    p.point = pt.sum(mg.shift, pt.scale(p, mg.cellSize))
                    pt.drawLine(g, {
                        a: l.point,
                        b: p.pointq
                    })
                }
            }
        }

        //	draw mode rectangle -------------------------------
        if (gameWindow.socket.opped) {
            var off = mg.offset

            g.lineWidth = 1
            g.strokeStyle = 'white'
            g.fillStyle = 'black'
            g.beginPath()
            g.rect(off, off, 2 * cs, 2 * cs * mg.modeKeys.length)
            g.fill()
            g.beginPath()
            g.rect(off, off, 2 * cs, 2 * cs * mg.modeKeys.length)
            g.stroke()

            g.textAlign = 'center'
            g.fillStyle = 'white'

            for (var i in mg.modeKeys) {
                var m = mg.modeKeys[i]
                var str = mg.modes[m].str
                g.fillText(str, off + cs, off + 2 * cs * i + cs + 1)
                if (m == mg.mode) {
                    g.beginPath()
                    g.rect(off + cs - cw / 2, off + cs - cw / 2 + 2 * cs * i, cw, cw)
                    g.stroke()
                }
            }
        }

        //	draw mouse ----------------------------------------
        g.fillStyle = 'white'

        ms.r = 10
        pt.fillCircle(g, ms)

        if (ms.inMode) {
            g.beginPath()
            g.rect(off + cs - cw / 2, off + cs - cw / 2 + 2 * cs * ms.i, cw, cw)
            g.stroke()
        } else if (ms && ms.point) {
            g.strokeStyle = 'white'
            var p = pt.sum(shf, pt.scale(ms.point, cs))
            p.r = cw / 2
            pt.drawRect(g, p)
        }

    },
    'nextPlayer': //	------------------------------------------------------------

    function() {
        console.log('nextPlayer')
        if (mg.player) {
            var found = false
            for (var i in mg.all.player) {
                if (i == mg.player.string) {
                    found = true
                } else if (found) {
                    return mg.player = mg.all.player[i]
                }
            }
        }

        for (var i in mg.all.player) {
            return mg.player = mg.all.player[i]
        }
        mg.locked = false
    },

    'cell': //	------------------------------------------------------------
    function(input) {
        //	input: {token:'mouse', mouse:{x,y,z}}
        //			cell cell relative to shift
        //	input: {token: 'point', point:{x,y,z}}
        //		cell cell in cell array at point
        //	input: {token: 'string', string:'<x-cord>,<y-cord>'}
        //		cell cell in cell array at string's index
        //	input: {token: 'cell', cell: <cell at string>}
        //			cell cell in input
        switch (input.token) {
            //	input.mouse || input.point || input.string || input.cell
            //	input.token = 'mouse' || 'point' || 'string' || 'cell'
        case 'mouse':
            input.point = pt.math(Math.round, pt.factor(pt.sub(input.mouse, mg.shift), mg.cellSize))

        case 'point':
            input.string = `${input.point.x},${input.point.y}`

        case 'string':
            input.cell = mg.cells[input.string]
            if (!input.point) {
                var s = input.string.split(',')
                input.point = {
                    x: parseFloat(s[0]),
                    y: parseFloat(s[1]),
                    z: 0
                }
            }

        case 'cell':
            return input.cell

        default:
            throw `observe(token: 'cell', input.token: '${input.token}')`
        }
    },
    'wire': //	------------------------------------------------------------
    function(input) {
        var t = {
            token: input.token
        }

        t[input.token] = input.a
        input.a = mg.observe.cell(t)

        t[input.token] = input.b
        input.b = mg.observe.cell(t)

        if (input.a && input.b) {
            if (input.a.string < input.b.string) {
                swap(input, 'a', 'b')
            }

            input.string = `[${input.a.string}],[${input.b.string}]`

            return mg.wires[input.string]
        } else {
            return null
        }
    },
    'status': //	----------------------------------------------------------
    function(input) {
        if (input.token == 'all') {
            var status = {}

            for (var i in mg.cells) {
                var s = mg.observe.status({
                    token: 'cell',
                    cell: mg.cells[i]
                })
                status[s.string] = s.status
            }

            return status

        } else {
            //	var cell = mg.observe.cell( input)
            var cell = input.cell

            var status = {
                string: cell.string,
                status: []
            }

            for (var i in mg.states) {
                if (cell[i]) {
                    status.status.push(i)
                }
            }
            if (cell.level) {
                status.portals = []
                for (var i in cell.portals) {
                    status.portals.push(i)
                }
            }

            return status
        }
    },

    'state': //	-----------------------------------------------------------
    function(input) {
        var cell = mg.observe.cell(input)
        return cell && cell[input.mode]
    },

    'check': //	-----------------------------------------------------------
    function() {

        //         if (!mg.player) {
        //             for (var i in mg.all.player) {
        //                 mg.player = mg.all.player[i]
        //             }
        //         }

        for (var i in mg.all.wire) {
            mg.all.wire[i].gate.open = true
        }

        for (var i in mg.all.pad) {
            var c = mg.all.pad[i]
            if (!c.player && !c.key) {
                c.gate.open = false
            }
        }

        mg.portals = 0
        for (var i in mg.all.portal) {
            var c = mg.all.portal[i]
            if (c.gate.open && ++mg.portals > 2) {
                for (var i in mg.all.portal) {
                    mg.all.portal[i].gate.open = false
                }
                mg.portals = 0
                break
            }
        }
    }

}
//	-----------------------------------------------------------------------------
//	Action
//	-----------------------------------------------------------------------------
mg.action = {
    'cell': //	------------------------------------------------------------
    //	input <- mg.observe.cell.input
    //		input.mouse || input.point || input.string || input.cell
    //		input.token = 'mouse' || 'point' || 'string' || 'cell'
    //	input.time = gameWindow.event.now
    function(input) {
        return input.cell = mg.observe.cell(input) || (mg.cells[input.string] = new mg.Cell(input))
    },

    'state': //	-----------------------------------------------------------
    //	input <- mg.observe.cell.input
    //		input.mouse || input.point || input.string || input.cell
    //	input.token = 'mouse' || 'point' || 'string' || 'cell'
    //	input <- mg.action.update.input
    //		input <- mg.observe.cell.input
    //		input.tick = gameWindow.tick
    //	input.state
    //	input.mode
    function(input) {
        var cell = mg.action.cell(input)
        switch (input.mode) {
        case 'level':
            if (cell.portal && input.state) {
                if (mg.level) {
                    if (input.state) {
                        mg.level.portals[cell.string] = cell
                    } else {
                        delete mg.level.portals[cell.string]
                    }
                }
            } else if (cell.level = input.state) {
                mg.level = cell
                cell.portals = {}
            } else {
                mg.level = null
                cell.portals = {}
            }

            break

        case 'space':
            //	-------------------

            if (input.state) {
                cell.space = true
                cell.wall = cell.door = false
            } else {
                cell.player = cell.key = cell.space = cell.pad = cell.portal = cell.square = false
            }

            break

        case 'wire':
            //	--------------------
            if (input.state) {
                cell.wire = true
            } else {
                cell.wire = false
                cell.wall = cell.wall || cell.door
                cell.square = cell.square && cell.key
                cell.door = cell.pad = cell.portal = false
            }

            break

        case 'wall':
            //	--------------------
            if (input.state) {
                cell.wall = true
                cell.player = cell.key = cell.square = false
                cell.space = cell.door = cell.pad = cell.portal = false
            } else {
                cell.wall = false
            }

            break

        case 'door':
            //	--------------------
            if (input.state) {
                cell.door = cell.wire = true
                cell.square = cell.square && cell.key
                cell.wall = cell.pad = cell.portal = false
            } else {
                cell.door = false
            }

            break

        case 'pad':
            //	---------------------
            if (input.state) {
                cell.pad = cell.wire = cell.space = true
                cell.wall = cell.door = cell.portal = false
            } else {
                cell.square = cell.square && cell.key
                cell.pad = false
            }

            break

        case 'portal':
            //	-------------------
            if (input.state) {
                cell.square = cell.square && cell.key
                cell.portal = cell.wire = cell.space = true
                cell.wall = cell.door = cell.pad = false
            } else {
                cell.portal = false
            }

            break

        case 'player':
            //	-------------------
            if (input.state) {
                mg.player = cell
                cell.space = cell.player = true
                cell.wall = cell.door = false
            } else {
                cell.player = false
            }

            break
        case 'key':
            //	----------------------
            if (input.state) {
                cell.space = cell.key = true
                cell.wall = cell.door = false
            } else {
                cell.key = false
                cell.square = cell.square && cell.pad
            }

            break

        case 'square':
            // --s----------------------
            cell.square = input.state && (cell.pad || cell.key)

            break
        }

        mg.status(cell)
        input.token = 'cell'
        mg.action.update(input)
        return cell
    },
    'update': //	----------------------------------------------------------

    //	input <- mg.observe.cell.input
    //		input.mouse || input.point || input.string || input.cell
    //		input.token = 'mouse' || 'point' || 'string' || 'cell'
    //	input.tick = gameWindow.events.tick
    function(input) {
        var cell = mg.action.cell(input)

        //	if player is has been cleared, get rid of mg.player
        //         if (!cell.player && mg.player == cell) {
        //             mg.player = null
        //         }

        //	for each state
        //		if cell[state] ? mg.all[state][cell] = cell : delete mg.all[state][cell]

        cell.clear = true
        for (var i in mg.states) {
            if (cell[i]) {
                cell.clear = false
                mg.all[i][cell.string] = cell
            } else {
                delete mg.all[i][cell.string]
            }
        }

        //	if all states are blank delete mg.cells[cell]
        if (cell.clear) {
            delete mg.cells[cell.string]
        }

        //	for each direction
        //		cell[direction] = mg.action.link(cell,mg.cells[cell + direction])
        for (var i in mg.directions) {
            var c = mg.observe.cell({
                token: 'point',
                point: pt.sum(cell, mg.directions[i])
            })
            cell[i] = {
                cell: c,
                wire: mg.action.wire({
                    token: 'cell',
                    a: cell,
                    b: c
                })
            }

            if (c) {
                //	stack overflow protection
                //	only cells in the immidiate vicinity are effected by update
                //	if update calls itself, a 'update' tag is added to the input
                //		and set to true to prevent stack overflow
                //	if update detects that this tag is true,
                //		it will only deal with itself and will not change it's neighbors
                if (!input.update) {
                    mg.action.update({
                        token: 'cell',
                        cell: c,
                        update: true
                    })
                }

                //	if a cell is clearing itself,
                //		it tells all its neighbors to check their gates in case it has
                //		cut off two branches from each other
                if (cell.clear) {
                    mg.action.gate({
                        token: 'cell',
                        cell: c
                    })
                }
            }
        }

        if (!input.update) {
            //	call mg.action.gate(cell)
            mg.action.gate({
                token: 'cell',
                cell: cell
            })

            //	call mg.observe.check()
            mg.observe.check()
        }
    },

    'wire': //	------------------------------------------------------------
    function(input) {
        var wire = mg.observe.wire(input)

        if (input.string) {
            input.clear = input.a.clear || input.b.clear || !input.a.wire || !input.b.wire

            if (input.clear) {
                delete mg.wires[input.string]
                return null
            } else {
                return mg.wires[input.string] = wire || new mg.Wire(input)
            }
        } else {
            return null
        }
    },

    'gate': //	------------------------------------------------------------

    function(input) {
        var cell = mg.observe.cell(input)

        //	if there is a cell, it is a wire,
        //		and either the input.gate is null or cell.gate != input.gate

        if (cell && !cell.clear && cell.wire && (!input.gate || input.gate != cell.gate)) {

            input.gate = cell.gate = input.gate || new mg.Gate()
            for (var i in mg.directions) {
                var l = cell[i]
                if (l && l.cell && l.cell.wire) {
                    l.wire.gate = input.gate
                    mg.action.gate({
                        token: 'cell',
                        cell: l.cell,
                        gate: input.gate
                    })
                }
            }
        }

    },

    'target': //	--------------------------------------------------------
    function(input) {
        var cell = mg.observe.cell(input)

        if (!cell) {
            return
        } else if (cell.player) {
            console.log('target player')
            mg.locked = mg.player == cell ? !mg.player : cell.key
            mg.player = cell
            return
        } else {
            mg.target = cell

        }

    },
    'move': //	------------------------------------------------------------
    function() {
        var swc = mg.action.move.swc || (mg.action.move.swc = function(src, tar, state) {
            if (src[state]) {
                src[state] = false
                tar[state] = true

                delete mg.all[state][src.string]
                mg.all[state][tar.string] = tar
            }
        }
        )
        var sav = mg.action.move.sav || (mg.action.move.sav = function(c) {
            mg.status(c, 'move')
        }
        )
        var trav = mg.action.move.trav || (mg.action.move.trav = function(src, tar) {
            if (!tar || tar.wall) {
                return false
            } else if (tar.door) {
                if (src.pad && !src.key) {
                    return false
                } else if (tar.gate.open) {
                    return true
                } else {
                    return false
                }
            } else if (tar.space) {
                return true
            } else {
                return false
            }
        }
        )
        var abs = Math.abs

        var p = mg.player
        var t = mg.target
        if (p && t) {

            if (p.portal && t.portal && p.gate.open && t.gate.open) {
                if (p.key && !t.key) {
                    swc(p, t, 'key')
                    swc(p, t, 'square')
                }

                if (!t.player) {
                    swc(p, t, 'player')
                }

                sav(p)
                sav(t)
                mg.player = t

                return
            }

            var s = pt.sub(t, p)

            if (!s.x && !s.y) {
                mg.player = p
                return mg.target = null
            }

            var pc = null
            var pcx = pt.copy(p)
            pcx.x += getSign(s.x)
            pcx = mg.observe.cell({
                token: 'point',
                point: pcx
            })

            var pcy = pt.copy(p)
            pcy.y += getSign(s.y)
            pcy = mg.observe.cell({
                token: 'point',
                point: pcy
            })

            if (trav(p, pcx)) {
                if (trav(p, pcy)) {

                    if (abs(s.x) >= abs(s.y)) {
                        pc = pcx
                    } else {
                        pc = pcy
                    }

                } else {
                    pc = pcx
                }
            } else if (trav(p, pcy)) {
                pc = pcy
            } else {
                return mg.target = null
            }

            if (!pc.player) {
                swc(p, pc, 'player')
            }

            var release = p.key && pc.pad

            if (pc.key) {
                mg.locked = true
            }

            if (p.key && !pc.key && mg.locked && !(p.pad && pc.door) && !(pc.pad && p.square != pc.square)) {
                if (p.square) {
                    p.square = p.pad
                    pc.square = true
                }
                swc(p, pc, 'key')
            }

            if (release) {
                console.log('unlock')
                mg.locked = false
            }

            sav(p)
            sav(pc)

            mg.observe.check()
            mg.player = pc

            if (pc.portal && pc.gate.open) {
                for (var i in mg.all.portal) {
                    if (i != pc.string && mg.all.portal[i].gate.open) {
                        mg.target = mg.all.portal[i]
                        return
                    }
                }
            }
        }

    },
    'shift': //	-----------------------------------------------------------
    function(input) {
        //	input <- gameWindow

        var gw = input
        var off = mg.offset
        var ms = gw.mouse
        var cs = mg.cellSize
        var cw = mg.cellWidth

        ms.tick = gw.events.tick

        if (mg.mode == 'game') {
            if (gw.keys.hasDown[' ']) {
                mg.observe.nextPlayer()
            }
            if (gw.keys.hasDown['Enter']) {
                mg.locked = !mg.locked
            }
            if (gw.keys.hasDown['r']) {
                mg.reset()
            }

            if (ms.hasUp) {
                mg.action.target({
                    token: 'mouse',
                    mouse: ms
                })
            }

            mg.action.move()
        }

        if (gw.socket.opped) {

            //	key commands -----------------------------------

            for (var i in mg.modes) {
                if (gw.keys.hasUp[mg.modes[i].key] && mg.mode != i) {
                    console.log(`mode set to '${mg.mode = i}'`)
                }
            }

            //	mouse commands ---------------------------------
            ms.inMode = off < ms.x && ms.x < off + 2 * cs && off < ms.y && ms.y < off + 2 * cs * mg.modeKeys.length

            if (ms.hasDown) {
                ms.state = !mg.observe.state(ms)
            }

            //	if in the mode selector rectangle (mode rect)
            if (ms.inMode) {
                //	cell mode index and save it to gw.mouse
                ms.i = Math.floor((ms.y - off) / 2 / cs)

                //	if the mouse is down in the mode rect
                //		set mg.mode to selected mode at index
                if (ms.isDown) {
                    var md = mg.modeKeys[ms.i]
                    if (mg.mode != md) {
                        console.log(`mode set to '${mg.mode = md}'`)
                    }
                }
            } else {
                //	for observe('draw') : to draw mouse acurately
                mg.observe.cell(ms)

                //	if mouse is down, either pan or set the state of the selected cell
                if (ms.isDown) {
                    if (mg.mode == 'pan') {
                        pt.sume(mg.shift, pt.sub(ms, ms.prev))
                    } else {
                        ms.mode = mg.mode
                        mg.action.state({
                            token: 'mouse',
                            mouse: ms,
                            mode: mg.mode,
                            state: ms.state
                        })
                    }
                }

            }
        }

    },

    'status': //	----------------------------------------------------------
    function(input) {
        if (input.token == 'all') {
            for (var i in input.status) {
                mg.action.status({
                    string: i,
                    status: input.status[i]
                })
            }
        } else {
            //	input.id: socket.id
            //	input.string: <string>
            //	input[<state>]: true
            //	....

            var cell = mg.action.cell({
                token: 'string',
                string: input.string
            })

            for (var i in mg.states) {
                cell[i] = false
            }

            for (var i in input.status) {
                cell[input.status[i]] = true
            }

            for (var i in input.portals) {
                cell.portals = cell.portals || {}
                var p = mg.action.state({
                    input: 'string',
                    string: input.portals[i],
                    mode: 'portal',
                    state: true
                })
                cell.portals[p.string] = p
            }

            mg.action.update({
                token: 'cell',
                cell: cell
            })
        }
    },

    'clear': //	-----------------------------------------------------------
    function(input) {
        mg.cells = []
        for (var i in mg.all) {
            mg.all[i] = new Object
        }
        mg.wires = []
        mg.events = []
        mg.shift = pt.zero()
        mg.player = null
    }
}
//	----------------------------------------
//	Console Setup
//	----------------------------------------

try {
    module.exports = mg
} catch (e) {}
