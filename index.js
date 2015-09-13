//Connect serial port. Emit incoming data.
var fs = require('fs');
var split = require('split');

var spRead = fs.createReadStream('/dev/arduino', {encoding: 'ascii'})
  .pipe(split());
var spWrite = fs.createWriteStream('/dev/arduino');

spRead.on('error', function (data){
  console.log(data.toString());
});

spWrite.on('error', function (data){
  console.log(data.toString());
});

//Update database.
var level = require('level');
var leveldb = level(__dirname + '/hemdb');

//Spawn rrdtool child process. Update RRD files.
var spawn = require('child_process').spawn;
var child = spawn('rrdtool', ['-']);

//child.stdout.on('data', function (data){
  //console.log(data.toString());
//});

child.stderr.on('data', function (data){
  console.error(data.toString());
});

var helper = require('./helper.js');

var dewOn = 56;
var dewOff = 54;
var dewCur = 55;
var dewStatus = 'Off';
var lastTime = Date.now();
var watchDog = Date.now();
var watchDogCount = 0;

function spData(rxData){
  var split = rxData.trim().split(':');
  var data = Number(split[1]);
  io.emit(split[0], data);
  switch(split[0]){
    case 'W':
      watchDog = Date.now();
      child.stdin.write('update ' + __dirname + '/hem-w.rrd N:' + data + '\n');
      helper.incCounter(leveldb, 'HEM!kWh!15m!', helper.time15m(), 0.002);
      helper.incCounter(leveldb, 'HEM!kWh!60m!', helper.time60m(), 0.002);
      helper.incCounter(leveldb, 'HEM!kWh!24h!', helper.time24h(), 0.002);
      helper.incCounter(leveldb, 'HEM!kWh!28d!', helper.time28d(), 0.002);
      helper.storeAvg(leveldb, 'HEM!W!15m!', helper.time15m(), data);
      helper.storeAvg(leveldb, 'HEM!W!60m!', helper.time60m(), data);
      helper.storeAvg(leveldb, 'HEM!W!24h!', helper.time24h(), data);
      helper.storeAvg(leveldb, 'HEM!W!28d!', helper.time28d(), data);
      leveldb.get('HEM!kWh!28d!' + helper.time28d(), function (err, value){
        if (err) {
          if (err.notFound) {
            // handle a 'NotFoundError' here
            io.emit('kWh', 0);
            return;
          }
        // I/O or other error, pass it up the callback chain
        return callback(err);
        } else {
          io.emit('kWh', JSON.parse(value)[1]);
        }
      });
      break;

    case 'T':
      child.stdin.write('update ' + __dirname + '/hem-in.rrd N:' + 
        data + '\n');
      helper.storeAvg(leveldb, 'HEM!In!15m!', helper.time15m(), data);
      helper.storeAvg(leveldb, 'HEM!In!60m!', helper.time60m(), data);
      helper.storeAvg(leveldb, 'HEM!In!24h!', helper.time24h(), data);
      helper.storeAvg(leveldb, 'HEM!In!28d!', helper.time28d(), data);
      break;

    case '289C653F03000027':
      child.stdin.write('update ' + __dirname + '/hem-out.rrd N:' + 
        data + '\n');
      helper.storeAvg(leveldb, 'HEM!Out!15m!', helper.time15m(), data);
      helper.storeAvg(leveldb, 'HEM!Out!60m!', helper.time60m(), data);
      helper.storeAvg(leveldb, 'HEM!Out!24h!', helper.time24h(), data);
      helper.storeAvg(leveldb, 'HEM!Out!28d!', helper.time28d(), data);
      break;

    case 'DEW':
      child.stdin.write('update ' + __dirname + '/hem-dew.rrd N:' + 
        data + '\n');
      dewCur=data;
      if (dewCur >= dewOn && Date.now() - lastTime > 300000 ) {
        dewStatus = 'On';
        spWrite.write('F');
        spWrite.write('C');
        spWrite.write('O');
        lastTime = Date.now();
      }
      if (dewCur <= dewOff && Date.now() - lastTime > 600000) {
        dewStatus = 'Off';
        spWrite.write('o');
        spWrite.write('c');
        spWrite.write('f');
        lastTime = Date.now();
      }
      break;

    case 'RH':
      child.stdin.write('update ' + __dirname + '/hem-rh.rrd N:' + 
        data + '\n');
      break;

    case '2809853F030000A7':
      child.stdin.write('update ' + __dirname + '/hem-upper.rrd N:' + 
        data + '\n');
      helper.storeAvg(leveldb, 'HEM!Upper!15m!', helper.time15m(), data);
      helper.storeAvg(leveldb, 'HEM!Upper!60m!', helper.time60m(), data);
      helper.storeAvg(leveldb, 'HEM!Upper!24h!', helper.time24h(), data);
      helper.storeAvg(leveldb, 'HEM!Upper!28d!', helper.time28d(), data);
      break;

    case '2813513F03000072':
      child.stdin.write('update ' + __dirname + '/hem-lower.rrd N:' + 
        data + '\n');
      helper.storeAvg(leveldb, 'HEM!Lower!15m!', helper.time15m(), data);
      helper.storeAvg(leveldb, 'HEM!Lower!60m!', helper.time60m(), data);
      helper.storeAvg(leveldb, 'HEM!Lower!24h!', helper.time24h(), data);
      helper.storeAvg(leveldb, 'HEM!Lower!28d!', helper.time28d(), data);
      break;

    case '2823583F0300006C':
      child.stdin.write('update ' + __dirname + '/hem-achigh.rrd N:' + 
        data + '\n');
      break;

    case '28AE3A3F0300005E':
      child.stdin.write('update ' + __dirname + '/hem-aclow.rrd N:' + 
        data + '\n');
      break;

    case 'GPM':
      child.stdin.write('update ' + __dirname + '/hem-gpm.rrd N:' + 
        data + '\n');
      helper.incCounter(leveldb, 'HEM!Gal!15m!', helper.time15m(), 0.25);
      helper.incCounter(leveldb, 'HEM!Gal!60m!', helper.time60m(), 0.25);
      helper.incCounter(leveldb, 'HEM!Gal!24h!', helper.time24h(), 0.25);
      helper.incCounter(leveldb, 'HEM!Gal!28d!', helper.time28d(), 0.25);
      helper.storeAvg(leveldb, 'HEM!GPM!15m!', helper.time15m(), data);
      helper.storeAvg(leveldb, 'HEM!GPM!60m!', helper.time60m(), data);
      helper.storeAvg(leveldb, 'HEM!GPM!24h!', helper.time24h(), data);
      helper.storeAvg(leveldb, 'HEM!GPM!28d!', helper.time28d(), data);
      break;
  }
}

spRead.on('data', spData);

//Webserver
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(80);

var spawn = require('child_process').spawn;
var SunCalc = require('suncalc');

function graph(req, res){
  res.setHeader('Content-Type', 'image/png');
  var arg = ['graph', '-', '-a', 'PNG', '-w', '1080', '-h', '240'];

  var times = SunCalc.getTimes(new Date(), 41.1660, -85.4831);
  
  arg.push('VRULE:' + Math.round(times.sunrise.getTime() / 1000) + '#FFA500');
  arg.push('VRULE:' + Math.round(times.solarNoon.getTime() / 1000) + '#ff0000');
  arg.push('VRULE:' + Math.round(times.sunset.getTime() / 1000) + '#00a5ff');

  if ('start' in req.query){
    var now = new Date ();
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
        arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(
          now.getDate() - 1), 41.1660, -85.4831).sunrise.getTime() / 1000) + 
          '#FFA500');
        arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(
          now.getDate() - 1), 41.1660, -85.4831).solarNoon.getTime() / 1000) + 
          '#ff0000');
        arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(
          now.getDate() - 1), 41.1660, -85.4831).sunset.getTime() / 1000) + 
          '#00a5ff');
        break;
      case '48h':
        arg.push('-s');
        arg.push('now-48hour');
        arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(
          now.getDate() - 1), 41.1660, -85.4831).sunrise.getTime() / 1000) + 
          '#FFA500');
        arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(
          now.getDate() - 1), 41.1660, -85.4831).solarNoon.getTime() / 1000) + 
          '#ff0000');
        arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(
          now.getDate() - 1), 41.1660, -85.4831).sunset.getTime() / 1000) + 
          '#00a5ff');
        arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(
          now.getDate() - 2), 41.1660, -85.4831).sunrise.getTime() / 1000) + 
          '#FFA500');
        arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(
          now.getDate() - 2), 41.1660, -85.4831).solarNoon.getTime() / 1000) + 
          '#ff0000');
        arg.push('VRULE:' + Math.round(SunCalc.getTimes(new Date().setDate(
          now.getDate() - 2), 41.1660, -85.4831).sunset.getTime() / 1000) + 
          '#00a5ff');
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
//      arg.push('CDEF:smoothed=dew, 1800, TREND');
//      arg.push('LINE1:smoothed#AA00AA:Dew_Point_Trend');
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
  child.on('error', function (data){
    console.error(data.toString());
  });
  child.stdout.on('data', function (data){
    //console.log(data.toString());
  });
  child.stdout.pipe(res);
}
app.get('/graph/:id', graph);

app.get('/dewstatus', function (req, res){
  var temp = Math.round((Date.now() - lastTime) / 1000);
  var min = Math.floor(temp / 60);
  var sec = temp % 60;
 
  if ('on' in req.query && 'off' in req.query){
    dewOn=Number(req.query.on);
    dewOff=Number(req.query.off);
  }

  var obj = {dewpoint:dewCur, on:dewOn, off:dewOff, state:dewStatus, 
    time:min + ':' + sec};
  res.send(obj);
});

var grpmap = [];
  grpmap.kWh='kWh';
  grpmap.W='W';
  grpmap.Gal='Gal';
  grpmap.GPM='GPM';
  grpmap.In='In';
  grpmap.Out='Out';
  grpmap.Upper='Upper';
  grpmap.Lower='Lower';
  grpmap.DEW='DEW';
  grpmap.T='T';

var timemap=[];
  timemap['15m']='15m';
  timemap['60m']='60m';
  timemap['24h']='24h';
  timemap['28d']='28d';

app.get('/chart/:grp/:time', function (req, res){
  var out = [];
  var grp = grpmap[req.params.grp];
  var time = timemap[req.params.time];
  leveldb.createReadStream({start:'HEM!' + grp + '!' + time + '!', 
    end:'HEM!' + grp + '!' + time + '!\xff', keys: false})
    .on('data', function (data){
      out.push(JSON.parse(data));
    })
    .on('close', function (){
      res.jsonp(out);
    });
});

app.use(express.static(__dirname + '/public'));

setInterval(function (){ 
  helper.purgeDB(leveldb, 'HEM!kWh!15m!', helper.time1dAgo());
  helper.purgeDB(leveldb, 'HEM!W!15m!', helper.time1dAgo());
  helper.purgeDB(leveldb, 'HEM!Gal!15m!', helper.time1dAgo());
  helper.purgeDB(leveldb, 'HEM!GPM!15m!', helper.time1dAgo());
  helper.purgeDB(leveldb, 'HEM!In!15m!', helper.time1dAgo());
  helper.purgeDB(leveldb, 'HEM!Out!15m!', helper.time1dAgo());
  helper.purgeDB(leveldb, 'HEM!Upper!15m!', helper.time1dAgo());
  helper.purgeDB(leveldb, 'HEM!Lower!15m!', helper.time1dAgo());
}, 3600000);

setInterval(function (){ 
  helper.purgeDB(leveldb, 'HEM!kWh!60m!', helper.time7dAgo());
  helper.purgeDB(leveldb, 'HEM!W!60m!', helper.time7dAgo());
  helper.purgeDB(leveldb, 'HEM!Gal!60m!', helper.time7dAgo());
  helper.purgeDB(leveldb, 'HEM!GPM!60m!', helper.time7dAgo());
  helper.purgeDB(leveldb, 'HEM!In!60m!', helper.time7dAgo());
  helper.purgeDB(leveldb, 'HEM!Out!60m!', helper.time7dAgo());
  helper.purgeDB(leveldb, 'HEM!Upper!60m!', helper.time7dAgo());
  helper.purgeDB(leveldb, 'HEM!Lower!60m!', helper.time7dAgo());
}, 3600000);

setInterval(function (){
  if (Date.now() - watchDog > 60000 ){
    helper.message('Watchdog expired');
    watchDogCount += 1;
  }
  if (watchDogCount > 2) {
    process.exit(1);
  }
}, 300000);
