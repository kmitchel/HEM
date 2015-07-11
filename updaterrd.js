var events = require('events');
var eventEmitter = new events.EventEmitter();
var reconnect = require('reconnect-net');

reconnect(function (client) {
	client.on('data', function(data) {
		var split = data.toString().trim().split(":");
		eventEmitter.emit(split[0],Number(split[1]));
	});
}).connect(8124);

var spawn = require('child_process').spawn;
var child = spawn('rrdtool', ['-']);

child.stdout.on('data', function(data){
});

child.stderr.on('data', function(data){
	console.log(data.toString());
});

function wEvent(data){
	child.stdin.write('update ' + __dirname + '/hem-w.rrd N:' + data + '\n');
};
eventEmitter.on('W', wEvent);

function inEvent(data){
	child.stdin.write('update ' + __dirname + '/hem-in.rrd N:' + data + '\n');
};
eventEmitter.on('T', inEvent);

function outEvent(data){
	child.stdin.write('update ' + __dirname + '/hem-out.rrd N:' + data + '\n');
};
eventEmitter.on('289C653F03000027', outEvent);

function dewEvent(data){
	child.stdin.write('update ' + __dirname + '/hem-dew.rrd N:' + data + '\n');
};
eventEmitter.on('DEW', dewEvent);

function rhEvent(data){
	child.stdin.write('update ' + __dirname + '/hem-rh.rrd N:' + data + '\n');
};
eventEmitter.on('RH', rhEvent);

function upperEvent(data){
	child.stdin.write('update ' + __dirname + '/hem-upper.rrd N:' + data + '\n');
};
eventEmitter.on('2809853F030000A7', upperEvent);

function lowerEvent(data){
	child.stdin.write('update ' + __dirname + '/hem-lower.rrd N:' + data + '\n');
};
eventEmitter.on('2813513F03000072', lowerEvent);

function achighEvent(data){
	child.stdin.write('update ' + __dirname + '/hem-achigh.rrd N:' + data + '\n');
};
eventEmitter.on('2823583F0300006C', achighEvent);

function aclowEvent(data){
	child.stdin.write('update ' + __dirname + '/hem-aclow.rrd N:' + data + '\n');
};
eventEmitter.on('28AE3A3F0300005E', aclowEvent);

function wGPM(data){
	child.stdin.write('update ' + __dirname + '/hem-gpm.rrd N:' + data + '\n');
};
eventEmitter.on('GPM', wGPM);


var sum = [];
var set = 50;

function trend(data){
	if (sum.push(data) > 60){
		sum.shift();
	};
	var total=0
	for	(index = 0; index < sum.length; index++) {
	    total += sum[index];
	}

	child.stdin.write('update ' + __dirname + '/hem-dew2.rrd N:' + (total/sum.length).toFixed(1) + '\n');
};
eventEmitter.on('DEW', trend);