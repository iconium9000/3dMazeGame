var express = require('express')
var app = express()
var serv = require('http').Server(app)
var io = require('socket.io')(serv,{})
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html')
})
app.use('/client',express.static(__dirname + '/client'))

serv.listen(2000)
console.log("Server Active")


io.sockets.on('connection', function(socket) {
	
	console.log('socket connection')
	
	
})

