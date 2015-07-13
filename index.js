//quick test


//Connect serial port. Emit incoming data.

var serialport = require("serialport");
var serialPort = serialport.SerialPort;

var sp = new serialPort("/dev/ttyAMA0",{
  baudrate: 57600,
  parser: serialport.parsers.readline("\r\n")
});

var events = require('events');
var eventEmitter = new events.EventEmitter();

function spData (data){
  var split = data.trim().split(":");
  eventEmitter.emit(split[0],Number(split[1]));
  io.emit(split[0],Number(split[1]));
};
sp.on('data', spData);

//Spawn rrdtool child process. Update RRD files.

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

//Rolling average of DEW point.

var sum = [];
function trend(data){
  if (sum.push(data) > 120){
    sum.shift();
  };
  var total=0
  for (index = 0; index < sum.length; index++) {
      total += sum[index];
  }
  child.stdin.write('update ' + __dirname + '/hem-dew2.rrd N:' + (total/sum.length).toFixed(1) + '\n');
  eventEmitter.emit('TREND',(total/sum.length).toFixed(1));
  io.emit('TREND',(total/sum.length).toFixed(1));

};
eventEmitter.on('DEW', trend);

//Webserver

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

var grpmap = [];
  grpmap['kWh']='kWh';
  grpmap['W']='W';
  grpmap['Gal']='Gal';
  grpmap['GPM']='GPM';
  grpmap['In']='In';
  grpmap['Out']='Out';
  grpmap['Upper']='Upper';
  grpmap['Lower']='Lower';
  grpmap['DEW']='DEW';
  grpmap['T']='T';

var timemap=[];
  timemap['15m']='15m';
  timemap['60m']='60m';
  timemap['24h']='24h';
  timemap['28d']='28d';

app.get('/chart/:grp/:time', function(req, res){
  var out = [];
  var grp = grpmap[req.params.grp];
  var time = timemap[req.params.time];
  leveldb.createReadStream({start:'HEM!' + grp + '!' + time + '!', end:'HEM!' + grp + '!' + time + '!\xff', keys: false})
    .on('data',function(data){
      out.push(JSON.parse(data));
    })
    .on('close',function(){
      res.jsonp(out);
    })
});

app.use(express.static(__dirname + '/public'));

//Dewostat functionality.

var dewOn = 60;
var dewOff = 57;
var dewCur = 58;
var dewStatus = "Off";a
var lastTime = Date.now();

eventEmitter.on('DEW', function(data){
  dewCur=data;
  if (dewCur >= dewOn && Date.now()-lastTime > 300000 ) {
    dewStatus = "On";
    sp.write('F');
    setTimeout(function(){
      sp.write('O');
      sp.write('C');
    },60000);
    lastTime = Date.now();
  };
  if (dewCur <= dewOff && Date.now()-lastTime > 600000) {
    dewStatus = "Off";
    sp.write('c');
    setTimeout(function(){
      sp.write('f');
      sp.write('o');
    },180000);
    lastTime = Date.now();
  };
  if (lastTime - Date.now()) {
    
  }
});

//Update database.
var level = require('level');
var leveldb = level( __dirname + '/hemdb');

eventEmitter.on('W', function(data){
  incCounter(leveldb,'HEM!kWh!15m!',time15m(),.002);
  incCounter(leveldb,'HEM!kWh!60m!',time60m(),.002);
  incCounter(leveldb,'HEM!kWh!24h!',time24h(),.002);
  incCounter(leveldb,'HEM!kWh!28d!',time28d(),.002);
  storeAvg(leveldb,'HEM!W!15m!',time15m(),data);
  storeAvg(leveldb,'HEM!W!60m!',time60m(),data);
  storeAvg(leveldb,'HEM!W!24h!',time24h(),data);

  leveldb.get('HEM!kWh!28d!' + time28d(),function(err,value){
    if (err) {
      if (err.notFound) {
        // handle a 'NotFoundError' here
        socket.emit('kWh', 0);
        return
      }
    // I/O or other error, pass it up the callback chain
    return callback(err)
    } else {
      io.emit('kWh', JSON.parse(value)[1]);
    }
  });
});

eventEmitter.on('GPM',function(data){
  incCounter(leveldb,'HEM!Gal!15m!',time15m(),.25);
  incCounter(leveldb,'HEM!Gal!60m!',time60m(),.25);
  incCounter(leveldb,'HEM!Gal!24h!',time24h(),.25);
  incCounter(leveldb,'HEM!Gal!28d!',time28d(),.25);
  storeAvg(leveldb,'HEM!GPM!15m!',time15m(),data);
  storeAvg(leveldb,'HEM!GPM!60m!',time60m(),data);
  storeAvg(leveldb,'HEM!GPM!24h!',time24h(),data);
});

eventEmitter.on('28955E3F03000045',function(data){
  storeAvg(leveldb,'HEM!In!15m!',time15m(),data);
  storeAvg(leveldb,'HEM!In!60m!',time60m(),data);
  storeAvg(leveldb,'HEM!In!24h!',time24h(),data);
});

eventEmitter.on('289C653F03000027',function(data){
  storeAvg(leveldb,'HEM!Out!15m!',time15m(),data);
  storeAvg(leveldb,'HEM!Out!60m!',time60m(),data);
  storeAvg(leveldb,'HEM!Out!24h!',time24h(),data);
  storeAvg(leveldb,'HEM!Out!28d!',time28d(),data);
});

eventEmitter.on('2809853F030000A7',function(data){
  storeAvg(leveldb,'HEM!Upper!15m!',time15m(),data);
  storeAvg(leveldb,'HEM!Upper!60m!',time60m(),data);
  storeAvg(leveldb,'HEM!Upper!24h!',time24h(),data);
  storeAvg(leveldb,'HEM!Upper!28d!',time28d(),data);
});

eventEmitter.on('2813513F03000072',function(data){
  storeAvg(leveldb,'HEM!Lower!15m!',time15m(),data);
  storeAvg(leveldb,'HEM!Lower!60m!',time60m(),data);
  storeAvg(leveldb,'HEM!Lower!24h!',time24h(),data);
  storeAvg(leveldb,'HEM!Lower!28d!',time28d(),data);
});


//Time helper functions
function time15m(){
  return Math.floor((Date.now()/1000)/(15*60))*15*60*1000;
}
function time60m(){
  return Math.floor((Date.now()/1000)/(60*60))*60*60*1000;
}
function time24h(){
  return new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()).getTime();
}
function time28d(){
  var month;
  new Date().getDate() > 6 ? month = new Date().getMonth() : month = new Date().getMonth() - 1
  return new Date(new Date().getFullYear(),month,7).getTime();
}
function time7dAgo(){
  return Date.now()-7*24*60*60*1000;
}
function time1dAgo(){
  return Date.now()-24*60*60*1000;
}
function time4hAgo(){
  return Date.now()-4*60*60*1000;
}

//Leveldb helper functions

//incCounter(leveldb,'HEM!kWh!',time15(),2);
function incCounter(db,prefix,timeStamp,incValue){
  db.get(prefix + timeStamp, function (err, value) {
    if (err) {
      if (err.notFound) {
        // handle a 'NotFoundError' here
        db.put(prefix + timeStamp, JSON.stringify([timeStamp,incValue]));
        return
      }
      // I/O or other error, pass it up the callback chain
      return callback(err)
    }
    // .. handle `value` here
    var temp = Number((JSON.parse(value)[1] + incValue).toFixed(3));
    db.put(prefix + timeStamp, JSON.stringify([timeStamp,temp]));
  })
}

function storeAvg(db,prefix,timeStamp,value){
  db.get(prefix + timeStamp, function (err, data) {
    if (err) {
      if (err.notFound) {
        // handle a 'NotFoundError' here
        //timestamp,min,count,culumative,max
        db.put(prefix + timeStamp, JSON.stringify([timeStamp,value,1,value,value]));
        return
      }
      // I/O or other error, pass it up the callback chain
      return callback(err)
    }
    // .. handle `value` here
    var min = JSON.parse(data)[1];
    var count = JSON.parse(data)[2];
    var sum = JSON.parse(data)[3];
    var max = JSON.parse(data)[4];

    min = Math.min(min,value);
    max = Math.max(max,value);

    count = count + 1;
    sum = Number((sum + value).toFixed(2));

    db.put(prefix + timeStamp, JSON.stringify([timeStamp,min,count,sum,max]));
  })

}

//purgeDB(leveldb,'HEM!kWh!',time4hAgo());
function purgeDB(db,prefix,timeStamp){
  db.createReadStream({start:prefix,end:prefix+timeStamp,values:false})
    .on('data',function(data){
      db.del(data);
    })
}

//
function readDB(db,prefix,res){
  var out = [];
  db.createReadStream({keys:false, start:prefix,end:prefix+'\xff'})
    .on('data',function(data){
      out.push([JSON.parse(data)[0],JSON.parse(data)[1]]);
    })
    .on('close',function(){
      res.send(out);
    })
}

var nodemailer = require('nodemailer');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'kmitchel46725@gmail.com',
        pass: 'mnt69dew'
    }
});

// NB! No need to recreate the transporter object. You can use
// the same transporter object for all e-mails

// setup e-mail data with unicode symbols
var mailOptions = {
    from: 'Kenneth Mitchell <kmitchel46725@gmail.com>', // sender address
    to: '2602298898@vtext.com', // list of receivers
    subject: 'HEM', // Subject line
//    text: 'Hello world ✔', // plaintext body
//    html: '<b>Hello world ✔</b>' // html body
};

// send mail with defined transport object
// transporter.sendMail(mailOptions, function(error, info){
//     if(error){
//         return console.log(error);
//     }
//     console.log('Message sent: ' + info.response);

// });