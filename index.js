var serialport = require("serialport");
var serialPort = serialport.SerialPort;

var sp = new serialPort("/dev/ttyAMA0",{
  baudrate: 57600,
  parser: serialport.parsers.readline("\r\n")
});

var events = require('events');
var eventEmitter = new events.EventEmitter();

function spData (data){
  var split = data.split(":");
  eventEmitter.emit(split[0],Number(split[1]));
};
sp.on('data', spData);

var net = require('net');
var server = net.createServer(function(c) { //'connection' listener
  c.on('error', function(){});
  c.on('end', function() {
    sp.removeListener('data', cWriteData);
  });
  function cWriteData(data){
    c.write(data + '\r\n');
  };
  sp.on('data', cWriteData);
  function cReadData(data){
    switch (data.toString().trim()){
      case 'h':
        sp.write('h');
        break;
      case 'H':
        sp.write('H');
        break;
      case 'f':
        sp.write('f');
        break;
      case 'F':
        sp.write('F');
        break;
      case 'c':
        sp.write('c');
        break;
      case 'C':
        sp.write('C');
        break;
      case 'o':
        sp.write('o');
        break;
      case 'O':
        sp.write('O');
        break;
    }
  };
  c.on('data',cReadData);
});

server.listen(8124);
