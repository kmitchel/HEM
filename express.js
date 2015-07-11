var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(80);

var spawn = require('child_process').spawn;
var SunCalc = require('suncalc');

function graph(req,res){
	res.setHeader('Content-Type', 'image/png');
	var arg = ['graph','-','-a','PNG','-w','1080','-h','240'];

	var times = SunCalc.getTimes(new Date(), 41.1660, -85.4831);
	
	arg.push('VRULE:' + Math.round(times.sunrise.getTime()/1000) + '#FFA500');
	arg.push('VRULE:' + Math.round(times.solarNoon.getTime()/1000) + '#ff0000');
	arg.push('VRULE:' + Math.round(times.sunset.getTime()/1000) + '#00a5ff');

	if ('start' in req.query){
		switch (req.query.start){
			case '1h':
				arg.push('-s');
				arg.push('now-1hour');
				break;
			case '2h':
				arg.push('-s');
				arg.push('now-2hour');
				break;
			case '4h':
				arg.push('-s');
				arg.push('now-4hour');
				break;
			case '6h':
				arg.push('-s');
				arg.push('now-4hour');
				break;
			case '12h':
				arg.push('-s');
				arg.push('now-12hour');
				break;
			case '24h':
				arg.push('-s');
				arg.push('now-24hour');
				var now = new Date ();
				arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(now.getDate() - 1), 41.1660, -85.4831).sunrise.getTime()/1000) + '#FFA500');
				arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(now.getDate() - 1), 41.1660, -85.4831).solarNoon.getTime()/1000) + '#ff0000');
				arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(now.getDate() - 1), 41.1660, -85.4831).sunset.getTime()/1000) + '#00a5ff');
				break;
			case '48h':
				arg.push('-s');
				arg.push('now-48hour');
				var now = new Date ();
				arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(now.getDate() - 1), 41.1660, -85.4831).sunrise.getTime()/1000) + '#FFA500');
				arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(now.getDate() - 1), 41.1660, -85.4831).solarNoon.getTime()/1000) + '#ff0000');
				arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(now.getDate() - 1), 41.1660, -85.4831).sunset.getTime()/1000) + '#00a5ff');
				arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(now.getDate() - 2), 41.1660, -85.4831).sunrise.getTime()/1000) + '#FFA500');
				arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(now.getDate() - 2), 41.1660, -85.4831).solarNoon.getTime()/1000) + '#ff0000');
				arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(now.getDate() - 2), 41.1660, -85.4831).sunset.getTime()/1000) + '#00a5ff');
				break;
		}
	}
	switch (req.params.id){
		case 'watt':
			arg.push('-o');
			arg.push('--units=si');
  			arg.push('DEF:w=' + __dirname + '/hem-w.rrd:w:AVERAGE');
  			arg.push('LINE1:w#000000:Watts');
			break;
		case 'temp':
			arg.push('DEF:rh=' + __dirname + '/hem-rh.rrd:rh:AVERAGE');
			arg.push('LINE1:rh#00ff00:Relative_Humidity');
			arg.push('DEF:dew=' + __dirname + '/hem-dew.rrd:dew:AVERAGE');
			arg.push('LINE1:dew#000000:Dew_Point');
			arg.push('DEF:dew2=' + __dirname + '/hem-dew2.rrd:dew:AVERAGE');
			arg.push('LINE1:dew2#ff00ff:Dew_Point');
			arg.push('DEF:in=' + __dirname + '/hem-in.rrd:in:AVERAGE');
			arg.push('LINE1:in#0000ff:Inside');
			arg.push('DEF:out=' + __dirname + '/hem-out.rrd:out:AVERAGE');
			arg.push('LINE1:out#ff0000:Outside');
			break;
		case 'wh':
			arg.push('DEF:lower=' + __dirname + '/hem-lower.rrd:lower:AVERAGE');
			arg.push('LINE1:lower#0000ff:Lower_WH');
			arg.push('DEF:upper=' + __dirname + '/hem-upper.rrd:upper:AVERAGE');
			arg.push('LINE1:upper#ff0000:Upper_WH');
			break;
		case 'ac':
			arg.push('DEF:aclow=' + __dirname + '/hem-aclow.rrd:aclow:AVERAGE');
			arg.push('LINE1:aclow#0000ff:AC_Low');		
			arg.push('DEF:achigh=' + __dirname + '/hem-achigh.rrd:achigh:AVERAGE');
			arg.push('LINE1:achigh#ff0000:AC_High');
			break;
		case 'gpm':
			arg.push('DEF:gpm=' + __dirname + '/hem-gpm.rrd:gpm:AVERAGE');
			arg.push('LINE1:gpm#000000:GPM');
			break;
	}
	var child = spawn('rrdtool', arg);
	child.on('error', function(){});
	child.stdout.pipe(res);
};
app.get('/graph/:id', graph);

app.get('/dewstatus', function(req, res){
  var temp = Math.round((Date.now()-lastTime)/1000);
  var min = Math.floor(temp/60);
  var sec = temp % 60;
 
  if ('on' in req.query && 'off' in req.query){
    dewOn=Number(req.query.on);
    dewOff=Number(req.query.off);
  };

   var obj = {dewpoint:dewCur, on:dewOn, off:dewOff, state:dewStatus, time:min + ':' + sec};

  res.send(obj);
});

app.use(express.static(__dirname + '/public'));

var reconnect = require('reconnect-net');

reconnect(function (client) {
	client.on('data', function(data) {
		var split = data.toString().trim().split(":");
		io.emit(split[0],Number(split[1]));

		if (split[0]=='DEW'){
			dewCur=Number(split[1]);
		}

		if (dewCur >= dewOn && Date.now()-lastTime > 300000 ) {
		  dewStatus = "On";
		  client.write('F\r\n');
		  setTimeout(function(){
		  	client.write('O\r\n');
		    client.write('C\r\n');
		  },60000);
		  lastTime = Date.now();
		};

		if (dewCur <= dewOff && Date.now()-lastTime > 600000) {
		  dewStatus = "Off";
		  client.write('c\r\n');
		  setTimeout(function(){
		    client.write('f\r\n');
		    client.write('o\r\n');
		  },180000);
		  lastTime = Date.now();
		};

	});

}).connect(8124);

var dewOn = 60;
var dewOff = 57;
var dewCur = 58;
var dewStatus = "Off";
var lastTime = Date.now();
