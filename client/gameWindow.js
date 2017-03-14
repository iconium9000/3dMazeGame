console.log('gameWindow.js: init')
var socket = io()
var canvas = document.getElementById('canvas')
var g = canvas.getContext('2d')
var keyDown = []
var keyUps = []
var eventQueue = []

function update() {
	mouse.ups = 0
	keyUps = []
	setTime()
	getSize()
	for (var i in eventQueue) {
		eventQueue[i]()
	}
	if (eventQueue.length != 0) {
		eventQueue = []
	}
}
var now, dt, last
var w, h, u
var mouse = {
	x: 0,
	y: 0,
	z: 0,
	r: 5,
	isDown: false,
	hasDragged: false,
	ups: 0
}

function setTime() {
	now = (new Date()).getTime()
	dt = now - last
	last = now
}

function getSize() {
	w = canvas.width = window.innerWidth - 15
	h = canvas.height = window.innerHeight - 20
	u = w > h ? h : w
}
// --------------------------------------------
// ReqFrame
// --------------------------------------------
var reqFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
	window.setTimeout(callback, 30)
}
// --------------------------------------------
// Mouse controls
// --------------------------------------------
$(canvas).css('cursor', 'none')

function setMouse(e) {
	mouse.x = e.clientX
	mouse.y = e.clientY
}
$(document).mousemove(function (e) {
	eventQueue.push(function () {
		setMouse(e)
		mouse.hasDragged = mouse.isDown
	})
})
$(document).mousedown(function (e) {
	eventQueue.push(function () {
		setMouse(e)
		mouse.hasDragged = false
		mouse.isDown = true
	})
})
$(document).mouseup(function (e) {
	eventQueue.push(function () {
		setMouse(e)
		mouse.isDown = false
		mouse.ups = true
	})
})
// --------------------------------------------
// Keyboard controls
// --------------------------------------------
function etochar(e) {
	return String.fromCharCode(e.which | 0x20)
}
$(document).keypress(function (e) {
	eventQueue.push(function () {
		keyDown[etochar(e)] = true
	})
})
$(document).keyup(function (e) {
	eventQueue.push(function () {
		var c = etochar(e)
		keyDown[c] = false
		keyUps[eto] = true
	})
})
