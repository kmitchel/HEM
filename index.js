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

//Webserver
var express = require('express');
var app = express();
var server = require('http').Server(app);
server.listen(8080);

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


var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/hem';

MongoClient.connect(url, function(err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    }

    app.get('/data/:collection', function(req, res) {
        var collectionName;
        if ('collection' in req.params) {
            collectionName = req.params.collection;
        }
        var out = [];
        db.collection(collectionName).find({
            t: {
                $gt: Date.now() - 6 * 60 * 60 * 1000
            }
        }).toArray(function(err, docs) {
            docs.forEach(function(element, index, array) {
                out.push([element.t, element.d]);
            });
            res.json([{
                data: out
            }]);
        });
    });

    app.get('/data/:collection/:time', function(req, res) {
        var collectionName;
        if ('collection' in req.params && 'time' in req.params) {
            collectionName = req.params.collection + '-' + req.params.time;
        }

        if (req.params.collection === 'power-kWh' || req.params.collection === 'water-Gal') {
            var out = [];
            db.collection(collectionName).find({
                // t: {
                //     $gt: Date.now() - 3 * 24 * 60 * 60 * 1000
                // }
            }).toArray(function(err, docs) {
                docs.sort(function(a, b) {
                    return a.t - b.t;
                });
                docs.forEach(function(element, index, array) {
                    out.push([element.t, element.d]);
                });
                res.json([{
                    data: out
                }]);
            });

        } else {

            var range = [],
                avg = [];
            db.collection(collectionName).find({
                //  t: {
                //      $gt: Date.now() - 2* 28 * 24  * 60 * 60 * 1000
                //  }
            }).toArray(function(err, docs) {
                docs.sort(function(a, b) {
                    return a.t - b.t;
                });
                docs.forEach(function(element, index, array) {
                    var average = Number((element.acc / element.cnt).toFixed(2));
                    range.push([element.t, element.min, element.max]);
                    avg.push([element.t, average]);
                });
                res.json([{
                    name: 'Min-Max',
                    data: range,
                    type: 'arearange'
                }, {
                    name: 'Avg',
                    data: avg
                }]);
            });
        }
    });
});

app.use(express.static(__dirname + '/public'));

var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://localhost', {
    clientId: 'raspberrypi' + Math.random().toString(16).substr(2, 8)
});

client.on('connect', function() {
    client.subscribe('#');
});

client.on('message', function(topic, message) {
    switch (topic) {
        case 'power/W':
            var dataW = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-w.rrd N:' + dataW + '\n');
            break;
        case 'water/GPM':
            var dataGPM = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-gpm.rrd N:' +
                dataGPM + '\n');
            break;
        case 'temp/tempF':
            var dataF = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-in.rrd N:' +
                dataF + '\n');
            break;
        case 'temp/dewF':
            var dataDew = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-dew.rrd N:' +
                dataDew + '\n');
            break;
        case 'temp/rh':
            var dataRH = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-rh.rrd N:' +
                dataRH + '\n');
            break;
        case 'temp/280049724c2001be':
            var dataOut = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-out.rrd N:' +
                dataOut + '\n');
            break;

        case 'temp/2809853f030000a7':
            var dataUpper = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-upper.rrd N:' +
                dataUpper + '\n');
            break;

        case 'temp/2813513f03000072':
            var dataLower = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-lower.rrd N:' +
                dataLower + '\n');
            break;

        case 'temp/289fa756b5013c68':
            var dataACHigh = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-achigh.rrd N:' +
                dataACHigh + '\n');
            break;

        case 'temp/2874913c46200105':
            var dataACLow = Number(message.toString());
            child.stdin.write('update ' + __dirname + '/hem-aclow.rrd N:' +
                dataACLow + '\n');
            break;

        case 'hvac/state':
            if (message.toString() == 'Heating' || message.toString() == 'HeatOn') {
                child.stdin.write('update ' + __dirname + '/hem-heat.rrd N:100\n');
            } else {
                child.stdin.write('update ' + __dirname + '/hem-heat.rrd N:0\n');
            }
            if (message.toString() == 'Cooling' || message.toString() == 'CoolOn') {
                child.stdin.write('update ' + __dirname + '/hem-cool.rrd N:100\n');
            } else {
                child.stdin.write('update ' + __dirname + '/hem-cool.rrd N:0\n');
            }
            break;
    }
});

