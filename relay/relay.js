const WebSocket = require('ws');
const dgram = require('dgram');
const client = dgram.createSocket('udp4');

client.on('listening', function () {
    var address = client.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
    var host = '192.168.43.199'
    console.log("Sending data to: " + host)
    client.send(message, 0, message.length, 4567, host, (err) => {
    });
});

client.bind(0);

var first_message = true;
client.on('message', function (message, remote) {
  if(first_message) {
    first_message = false;
    console.log("Receiving data from sensor");
  }
    sockets.forEach((s) => {
      s.send(message);
    });
});

var message = new Buffer('start');

const wss = new WebSocket.Server({ port: 8080 });

var sockets = [];

wss.on('connection', function connection(ws) {
  sockets.push(ws);
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  ws.on('close', () => {
    var i = sockets.indexOf(ws);
    sockets.splice(i,1);
    console.log("Number of connections: " + sockets.length);
  });
});
