//Update database.
var level = require('level');
var leveldb = level(__dirname + '/hemdb');

//Spawn rrdtool child process. Update RRD files.
var spawn = require('child_process').spawn;
var child = spawn('rrdtool', ['-']);

child.stdout.on('data', function(data) {
    if (data.toString().indexOf('OK') !== 0) {
        console.log(data.toString());
    }
});

child.stderr.on('data', function(data) {
    console.error(data.toString());
});

var helper = require('./helper.js');

var watchDog = Date.now();
var watchDogCount = 0;

//Webserver
var express = require('express');
var app = express();
var server = require('http').Server(app);
server.listen(80);

var spawn = require('child_process').spawn;
var SunCalc = require('suncalc');

function graph(req, res) {
    res.setHeader('Content-Type', 'image/png');
    var arg = ['graph', '-', '-a', 'PNG', '-w', '1080', '-h', '240'];

    var times = SunCalc.getTimes(new Date(), 41.1660, -85.4831);

    arg.push('VRULE:' + Math.round(times.sunrise.getTime() / 1000) + '#FFA500');
    arg.push('VRULE:' + Math.round(times.solarNoon.getTime() / 1000) + '#ff0000');
    arg.push('VRULE:' + Math.round(times.sunset.getTime() / 1000) + '#00a5ff');

    if ('start' in req.query) {
        var now = new Date();
        switch (req.query.start) {
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
    switch (req.params.id) {
        case 'watt':
            arg.push('-o');
            arg.push('--units=si');
            arg.push('DEF:w=' + __dirname + '/hem-w.rrd:w:AVERAGE');
            arg.push('LINE1:w#000000:Watts');
            break;
        case 'temp':
            arg.push('DEF:heat=' + __dirname + '/hem-heat.rrd:heat:AVERAGE');
            arg.push('DEF:cool=' + __dirname + '/hem-cool.rrd:cool:AVERAGE');
            arg.push('DEF:rh=' + __dirname + '/hem-rh.rrd:rh:AVERAGE');
            arg.push('LINE1:rh#00ff00:Relative_Humidity');
            arg.push('DEF:dew=' + __dirname + '/hem-dew.rrd:dew:AVERAGE');
            arg.push('LINE1:dew#000000:Dew_Point');
            //      arg.push('CDEF:smoothed=dew, 1800, TREND');
            //      arg.push('LINE1:smoothed#AA00AA:Dew_Point_Trend');
            arg.push('DEF:in=' + __dirname + '/hem-in.rrd:in:AVERAGE');
            arg.push('LINE1:in#7D3C98:Inside');
            arg.push('DEF:out=' + __dirname + '/hem-out.rrd:out:AVERAGE');
            arg.push('LINE1:out#ff0000:Outside');
            arg.push('CDEF:heaton=heat,0,GT,in,UNKN,IF');
            arg.push('LINE2:heaton#ff0000');
            arg.push('CDEF:coolon=cool,0,GT,in,UNKN,IF');
            arg.push('LINE2:coolon#0000ff');
            break;
        case 'wh':
            arg.push('DEF:upper=' + __dirname + '/hem-upper.rrd:upper:AVERAGE');
            arg.push('LINE1:upper#ff0000:Upper_WH');
            arg.push('DEF:lower=' + __dirname + '/hem-lower.rrd:lower:AVERAGE');
            arg.push('LINE1:lower#0000ff:Lower_WH');
            break;
        case 'ac':
            arg.push('DEF:aclow=' + __dirname + '/hem-aclow.rrd:aclow:AVERAGE');
            arg.push('LINE1:aclow#0000ff:AC_Low');
            arg.push('DEF:achigh=' + __dirname + '/hem-achigh.rrd:achigh:AVERAGE');
            arg.push('LINE1:achigh#ff0000:AC_High');
            break;
        case 'gpm':
            arg.push('DEF:gpm=' + __dirname + '/hem-gpm.rrd:gpm:AVERAGE');
            arg.push('CDEF:fixgpm=gpm,UN,0,gpm,IF');
            arg.push('LINE1:fixgpm#000000:GPM');
            break;
    }
    var child = spawn('rrdtool', arg);
    child.on('error', function(data) {
        console.error(data.toString());
    });
    child.stdout.on('data', function(data) {
        //console.log(data.toString());
    });
    child.stdout.pipe(res);
}
app.get('/graph/:id', graph);

var grpmap = [];
grpmap.kWh = 'kWh';
grpmap.W = 'W';
grpmap.Gal = 'Gal';
grpmap.GPM = 'GPM';
grpmap.In = 'In';
grpmap.Out = 'Out';
grpmap.Upper = 'Upper';
grpmap.Lower = 'Lower';
grpmap.DEW = 'DEW';
grpmap.T = 'T';
grpmap.heat = 'heat';
grpmap.cool = 'cool';

var timemap = [];
timemap['15m'] = '15m';
timemap['60m'] = '60m';
timemap['24h'] = '24h';
timemap['28d'] = '28d';

app.get('/chart/:grp/:time', function(req, res) {
    var out = [];
    var grp = grpmap[req.params.grp];
    var time = timemap[req.params.time];
    leveldb.createReadStream({
            start: 'HEM!' + grp + '!' + time + '!',
            end: 'HEM!' + grp + '!' + time + '!\xff',
            keys: false
        })
        .on('data', function(data) {
            out.push(JSON.parse(data));
        })
        .on('close', function() {
            res.jsonp(out);
        });
});

app.use(express.static(__dirname + '/public'));

setInterval(function() {
    helper.purgeDB(leveldb, 'HEM!kWh!15m!', helper.time1dAgo());
    helper.purgeDB(leveldb, 'HEM!W!15m!', helper.time1dAgo());
    helper.purgeDB(leveldb, 'HEM!Gal!15m!', helper.time1dAgo());
    helper.purgeDB(leveldb, 'HEM!GPM!15m!', helper.time1dAgo());
    helper.purgeDB(leveldb, 'HEM!In!15m!', helper.time1dAgo());
    helper.purgeDB(leveldb, 'HEM!Out!15m!', helper.time1dAgo());
    helper.purgeDB(leveldb, 'HEM!Upper!15m!', helper.time1dAgo());
    helper.purgeDB(leveldb, 'HEM!Lower!15m!', helper.time1dAgo());
    helper.purgeDB(leveldb, 'HEM!cool!15m!', helper.time1dAgo());
    helper.purgeDB(leveldb, 'HEM!heat!15m!', helper.time1dAgo());
}, 3600000);

setInterval(function() {
    helper.purgeDB(leveldb, 'HEM!kWh!60m!', helper.time7dAgo());
    helper.purgeDB(leveldb, 'HEM!W!60m!', helper.time7dAgo());
    helper.purgeDB(leveldb, 'HEM!Gal!60m!', helper.time7dAgo());
    helper.purgeDB(leveldb, 'HEM!GPM!60m!', helper.time7dAgo());
    helper.purgeDB(leveldb, 'HEM!In!60m!', helper.time7dAgo());
    helper.purgeDB(leveldb, 'HEM!Out!60m!', helper.time7dAgo());
    helper.purgeDB(leveldb, 'HEM!Upper!60m!', helper.time7dAgo());
    helper.purgeDB(leveldb, 'HEM!Lower!60m!', helper.time7dAgo());
    helper.purgeDB(leveldb, 'HEM!cool!60m!', helper.time7dAgo());
    helper.purgeDB(leveldb, 'HEM!heat!60m!', helper.time7dAgo());
}, 3600000);

//setInterval(function (){
//  if (Date.now() - watchDog > 60000 ){
//    helper.message('Watchdog expired');
//    watchDogCount += 1;
//  }
//  if (watchDogCount > 2) {
//    process.exit(1);
//  }
//}, 300000);


var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://localhost', {
    clientId: 'raspberrypi'
});

client.on('connect', function() {
    client.subscribe('#');
});

client.on('message', function(topic, message) {
    switch (topic) {
        case 'power/W':
            var data = Number(message.toString());
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
            leveldb.get('HEM!kWh!28d!' + helper.time28d(), function(err, value) {
                if (err) {
                    if (err.notFound) {
                        // handle a 'NotFoundError' here
                        client.publish('power/kWh', Number(0).toString());
                        return;
                    }
                    // I/O or other error, pass it up the callback chain
                    return callback(err);
                } else {
                    client.publish('power/kWh', JSON.parse(value)[1].toString());
                }
            });
            break;
        case 'water/GPM':
            var data = Number(message.toString());
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
            leveldb.get('HEM!Gal!28d!' + helper.time28d(), function(err, value) {
                if (err) {
                    if (err.notFound) {
                        // handle a 'NotFoundError' here
                        client.publish('water/Gal', Number(0).toString());
                        return;
                    }
                    // I/O or other error, pass it up the callback chain
                    return callback(err);
                } else {
                    client.publish('water/Gal', JSON.parse(value)[1].toString());
                }
            });
            break;
        case 'temp/tempF':
            var data = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-in.rrd N:' +
                data + '\n');
            helper.storeAvg(leveldb, 'HEM!In!15m!', helper.time15m(), data);
            helper.storeAvg(leveldb, 'HEM!In!60m!', helper.time60m(), data);
            helper.storeAvg(leveldb, 'HEM!In!24h!', helper.time24h(), data);
            helper.storeAvg(leveldb, 'HEM!In!28d!', helper.time28d(), data);
            break;
        case 'temp/dewF':
            var data = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-dew.rrd N:' +
                data + '\n');
            break;
        case 'temp/rh':
            var data = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-rh.rrd N:' +
                data + '\n');
            break;
        case 'temp/289c653f03000027':
            var data = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-out.rrd N:' +
                data + '\n');
            helper.storeAvg(leveldb, 'HEM!Out!15m!', helper.time15m(), data);
            helper.storeAvg(leveldb, 'HEM!Out!60m!', helper.time60m(), data);
            helper.storeAvg(leveldb, 'HEM!Out!24h!', helper.time24h(), data);
            helper.storeAvg(leveldb, 'HEM!Out!28d!', helper.time28d(), data);
            break;

        case 'temp/2809853f030000a7':
            var data = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-upper.rrd N:' +
                data + '\n');
            helper.storeAvg(leveldb, 'HEM!Upper!15m!', helper.time15m(), data);
            helper.storeAvg(leveldb, 'HEM!Upper!60m!', helper.time60m(), data);
            helper.storeAvg(leveldb, 'HEM!Upper!24h!', helper.time24h(), data);
            helper.storeAvg(leveldb, 'HEM!Upper!28d!', helper.time28d(), data);
            break;

        case 'temp/2813513f03000072':
            var data = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-lower.rrd N:' +
                data + '\n');
            helper.storeAvg(leveldb, 'HEM!Lower!15m!', helper.time15m(), data);
            helper.storeAvg(leveldb, 'HEM!Lower!60m!', helper.time60m(), data);
            helper.storeAvg(leveldb, 'HEM!Lower!24h!', helper.time24h(), data);
            helper.storeAvg(leveldb, 'HEM!Lower!28d!', helper.time28d(), data);
            break;

        case 'temp/2823583f0300006c':
            var data = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-achigh.rrd N:' +
                data + '\n');
            break;

        case 'temp/28ae3a3f0300005e':
            var data = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-aclow.rrd N:' +
                data + '\n');
            break;

        case 'hvac/state':
            if (message.toString() == 'Heating' || message.toString() == 'HeatOn') {
                helper.incCounter(leveldb, 'HEM!heat!15m!', helper.time15m(), 0.5);
                helper.incCounter(leveldb, 'HEM!heat!60m!', helper.time60m(), 0.5);
                helper.incCounter(leveldb, 'HEM!heat!24h!', helper.time24h(), 0.5);
                helper.incCounter(leveldb, 'HEM!heat!28d!', helper.time28d(), 0.5);
                child.stdin.write('update ' + __dirname + '/hem-heat.rrd N:100\n');
            } else {
                child.stdin.write('update ' + __dirname + '/hem-heat.rrd N:0\n');
            }
            if (message.toString() == 'Cooling' || message.toString() == 'CoolOn') {
                helper.incCounter(leveldb, 'HEM!cool!15m!', helper.time15m(), 0.5);
                helper.incCounter(leveldb, 'HEM!cool!60m!', helper.time60m(), 0.5);
                helper.incCounter(leveldb, 'HEM!cool!24h!', helper.time24h(), 0.5);
                helper.incCounter(leveldb, 'HEM!cool!28d!', helper.time28d(), 0.5);
                child.stdin.write('update ' + __dirname + '/hem-cool.rrd N:100\n');
            } else {
                child.stdin.write('update ' + __dirname + '/hem-cool.rrd N:0\n');
            }
            break;
    }
});
