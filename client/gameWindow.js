console.log('gameWindow.js: init')
var gameWindow = {
	socket: io(),
	keys: {
		isDown: [],
		hasDown: [],
		hasUp: [],
		update: function(e) {
			e.hasDown = []
			e.hasUp = []
		}
	},
	events: {
		queue: [],
		tick: 0,
		now: null,
		dt: null,
		last: null,
		active: false,
		update: function(e) {
			e.now = (new Date()).getTime()
			e.dt = e.now - e.last
			e.last = e.now
			for (var i in e.queue) {
				e.queue[i]()
			}
			++e.tick
			e.queue = []
		}
	},
	display: {
		canvas: document.getElementById('canvas'),
		width: 0,
		height: 0,
		update: function(e) {
			e.width = e.canvas.width = window.innerWidth - 40
			e.heigth = e.canvas.height = window.innerHeight - 40
		}
	},
	mouse: {
		x: 0,
		y: 0,
		z: 0,
		prev: {
			x: 0,
			y: 0,
			z: 0,
			isDown: false
		},
		token: 'mouse',
		isDown: false,
		hasDown: false,
		hasDragged: false,
		hasUp: false,
		update: function(e) {
			e.hasDown = e.hasDragged = e.hasUp = false
			e.prev = pt.copy(e)
			e.prev.isDown = e.isDown
		}
	},
	tick: function(e, x, i, f) {
		e.display.g = e.display.canvas.getContext('2d')
		e.mouse.mouse = e.mouse
		e.events.active = true

		$(canvas).css('cursor', 'none')

		i(e, x)
		tick()

		function tick() {
			e.display.update(e.display)

			f(e, x)

			e.mouse.update(e.mouse)
			e.keys.update(e.keys)
			e.events.update(e.events)

			if (e.events.active) {
				$(canvas).css('cursor', 'none')
				reqFrame(tick)
			} else {
				$(canvas).css('cursor', 'default')
			}
		}

	}
}

var reqFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame || function(callback) {
		window.setTimeout(callback, 30)
	}
// --------------------------------------------
// Mouse controls
// --------------------------------------------

function setMouse(e) {
	gameWindow.mouse.x = e.clientX - 7
	gameWindow.mouse.y = e.clientY - 7
}
$(document).mousemove(function(e) {
	gameWindow.events.queue.push(function() {
		setMouse(e)
		gameWindow.mouse.hasDragged = gameWindow.mouse.isDown
	})
})
$(document).mousedown(function(e) {
	gameWindow.events.queue.push(function() {
		setMouse(e)
		gameWindow.mouse.hasDragged = false
		gameWindow.mouse.isDown = true
		gameWindow.mouse.hasDown = true
	})
})
$(document).mouseup(function(e) {
	gameWindow.events.queue.push(function() {
		setMouse(e)
		gameWindow.mouse.isDown = false
		gameWindow.mouse.hasUp = true
	})
})
// --------------------------------------------
// Keyboard controls
// --------------------------------------------
function etochar(e) {
	return String.fromCharCode(e.which | 0x20)
}
$(document).keypress(function(e) {
	gameWindow.events.queue.push(function() {
		var c = etochar(e)
		gameWindow.keys.isDown[c] = true
		gameWindow.keys.hasDown[c] = true
	})
})
$(document).keyup(function(e) {
	gameWindow.events.queue.push(function() {
		var c = etochar(e)
		gameWindow.keys.isDown[c] = false
		gameWindow.keys.hasUp[c] = true
	})
})
document.onkeydown = function(e) {
	gameWindow.events.queue.push(function() {
		gameWindow.keys.hasDown[e.key] = true
	})
}
