//Spawn rrdtool child process. Update RRD files.
var spawn = require("child_process").spawn
var child = spawn("rrdtool", ["-"])

child.stdout.on("data", function(data) {
    if (data.toString().indexOf("OK") !== 0) {
        console.log(data.toString())
    }
})

child.stderr.on("data", function(data) {
    console.error(data.toString())
})

//Webserver
var express = require("express")
var compression = require('compression')
var app = express()
var server = require("http").Server(app)
server.listen(8080)

app.use(compression())

var spawn = require("child_process").spawn
var SunCalc = require("suncalc")

function graph(req, res) {
    res.setHeader("Content-Type", "image/png")
    var arg = ["graph", "-", "-a", "PNG", "-w", "1080", "-h", "240"]

    var times = SunCalc.getTimes(new Date(), 41.1660, -85.4831)

    arg.push("VRULE:" + Math.round(times.sunrise.getTime() / 1000) + "#FFA500")
    arg.push("VRULE:" + Math.round(times.solarNoon.getTime() / 1000) + "#ff0000")
    arg.push("VRULE:" + Math.round(times.sunset.getTime() / 1000) + "#00a5ff")

    if ("start" in req.query) {
        var now = new Date()
        switch (req.query.start) {
            case "1h":
                arg.push("-s")
                arg.push("now-1hour")
                break
            case "2h":
                arg.push("-s")
                arg.push("now-2hour")
                break
            case "4h":
                arg.push("-s")
                arg.push("now-4hour")
                break
            case "6h":
                arg.push("-s")
                arg.push("now-4hour")
                break
            case "12h":
                arg.push("-s")
                arg.push("now-12hour")
                break
            case "24h":
                arg.push("-s")
                arg.push("now-24hour")
                arg.push("VRULE:" + Math.round(SunCalc.getTimes(new Date().setDate(
                        now.getDate() - 1), 41.1660, -85.4831).sunrise.getTime() / 1000) +
                    "#FFA500")
                arg.push("VRULE:" + Math.round(SunCalc.getTimes(new Date().setDate(
                        now.getDate() - 1), 41.1660, -85.4831).solarNoon.getTime() / 1000) +
                    "#ff0000")
                arg.push("VRULE:" + Math.round(SunCalc.getTimes(new Date().setDate(
                        now.getDate() - 1), 41.1660, -85.4831).sunset.getTime() / 1000) +
                    "#00a5ff")
                break
            case "48h":
                arg.push("-s")
                arg.push("now-48hour")
                arg.push("VRULE:" + Math.round(SunCalc.getTimes(new Date().setDate(
                        now.getDate() - 1), 41.1660, -85.4831).sunrise.getTime() / 1000) +
                    "#FFA500")
                arg.push("VRULE:" + Math.round(SunCalc.getTimes(new Date().setDate(
                        now.getDate() - 1), 41.1660, -85.4831).solarNoon.getTime() / 1000) +
                    "#ff0000")
                arg.push("VRULE:" + Math.round(SunCalc.getTimes(new Date().setDate(
                        now.getDate() - 1), 41.1660, -85.4831).sunset.getTime() / 1000) +
                    "#00a5ff")
                arg.push("VRULE:" + Math.round(SunCalc.getTimes(new Date().setDate(
                        now.getDate() - 2), 41.1660, -85.4831).sunrise.getTime() / 1000) +
                    "#FFA500")
                arg.push("VRULE:" + Math.round(SunCalc.getTimes(new Date().setDate(
                        now.getDate() - 2), 41.1660, -85.4831).solarNoon.getTime() / 1000) +
                    "#ff0000")
                arg.push("VRULE:" + Math.round(SunCalc.getTimes(new Date().setDate(
                        now.getDate() - 2), 41.1660, -85.4831).sunset.getTime() / 1000) +
                    "#00a5ff")
                break
        }
    }
    switch (req.params.id) {
        case "watt":
            arg.push("-o")
            arg.push("--units=si")
            arg.push("DEF:w=" + __dirname + "/hem-w.rrd:w:AVERAGE")
            arg.push("LINE1:w#000000:Watts")
            break
        case "temp":
            arg.push("DEF:heat=" + __dirname + "/hem-heat.rrd:heat:AVERAGE")
            arg.push("DEF:cool=" + __dirname + "/hem-cool.rrd:cool:AVERAGE")
            arg.push("DEF:rh=" + __dirname + "/hem-rh.rrd:rh:AVERAGE")
            arg.push("LINE1:rh#00ff00:Relative_Humidity")
            arg.push("DEF:dew=" + __dirname + "/hem-dew.rrd:dew:AVERAGE")
            arg.push("LINE1:dew#000000:Dew_Point")
            //      arg.push("CDEF:smoothed=dew, 1800, TREND")
            //      arg.push("LINE1:smoothed#AA00AA:Dew_Point_Trend")
            arg.push("DEF:in=" + __dirname + "/hem-in.rrd:in:AVERAGE")
            arg.push("LINE1:in#7D3C98:Inside")
            arg.push("DEF:out=" + __dirname + "/hem-out.rrd:out:AVERAGE")
            arg.push("LINE1:out#ff0000:Outside")
            arg.push("CDEF:heaton=heat,0,GT,in,UNKN,IF")
            arg.push("LINE2:heaton#ff0000")
            arg.push("CDEF:coolon=cool,0,GT,in,UNKN,IF")
            arg.push("LINE2:coolon#0000ff")
            break
        case "wh":
            arg.push("DEF:upper=" + __dirname + "/hem-upper.rrd:upper:AVERAGE")
            arg.push("LINE1:upper#ff0000:Upper_WH")
            arg.push("DEF:lower=" + __dirname + "/hem-lower.rrd:lower:AVERAGE")
            arg.push("LINE1:lower#0000ff:Lower_WH")
            break
        case "ac":
            arg.push("DEF:aclow=" + __dirname + "/hem-aclow.rrd:aclow:AVERAGE")
            arg.push("LINE1:aclow#0000ff:AC_Low")
            arg.push("DEF:achigh=" + __dirname + "/hem-achigh.rrd:achigh:AVERAGE")
            arg.push("LINE1:achigh#ff0000:AC_High")
            break
        case "gpm":
            arg.push("DEF:gpm=" + __dirname + "/hem-gpm.rrd:gpm:AVERAGE")
            arg.push("CDEF:fixgpm=gpm,UN,0,gpm,IF")
            arg.push("LINE1:fixgpm#000000:GPM")
            break
    }
    var child = spawn("rrdtool", arg)
    child.on("error", function(data) {
        console.error(data.toString())
    })
    child.stdout.on("data", function(data) {
        //console.log(data.toString())
    })
    child.stdout.pipe(res)
}
app.get("/graph/:id", graph)

let leveldb = require("level")("./hemdb", {
    valueEncoding: "json"
})

app.get("/data/:collection/:past", function(req, res) {
    var collectionName
    var past

    if ("collection" in req.params) {
        collectionName = req.params.collection
    }

    if ("past" in req.params){
        past = req.params.past
    } else {
        past = "01"
    }

    var out = []
    var index = 0

    if (past == '0') {
        past =""
    } else {
        past = Date.now() - Number(past) * 60 * 60 * 1000
    }

    leveldb.createReadStream({gt: collectionName + "-00-" + past, lt: collectionName + "-00."})
    .on('data', function(data) {
        let t = data.key.split("-")[3]
        out[index] = [Number(t), data.value]
        index++
    })
    .on('end', function() {
        if (collectionName == "water-GPM") {
            res.json([{
                data: out,
                type: "bar"
            }])
        } else {
            res.json([{
                data: out
            }])
        }
    })
})

app.get("/data/:collection/:time/:past", function(req, res) {
    var collectionName
    if ("collection" in req.params && "time" in req.params) {
        collectionName = req.params.collection + "-" + req.params.time
    }

    if ("past" in req.params){
        past = req.params.past
    } else {
        past = "01"
    }

    if (past == '0') {
        past =""
    } else {
        past = Date.now() - Number(past) * 60 * 60 * 1000
    }

    if (req.params.collection === "power-kWh" || req.params.collection === "water-Gal" || req.params.collection === "hvac-heat") {

        let out = []
        leveldb.createReadStream({gt: collectionName + "-" + past, lt: collectionName + "."})
            .on('data', function(data) {
                let t = data.key.split("-")[3]
                out.push([Number(t), data.value])
            })
            .on('end', function() {
                res.json([{
                    data: out
                }])
            })
    } else {
        let range = []
        let avg = []
        leveldb.createReadStream({gt: collectionName + "-" + past, lt: collectionName + "."})
            .on('data', function(data) {
                let t = data.key.split("-")[3]
                range.push([Number(t), data.value[2], data.value[3]])
                avg.push([Number(t), Number((data.value[1] / data.value[0]).toFixed(2))])
            })
            .on('end', function() {
                res.json([{
                    name: "Min-Max",
                    data: range,
                    type: "arearange"
                }, {
                    name: "Avg",
                    data: avg
                }])
            })
    }
})

app.use(express.static(__dirname + "/public"))

var mqtt = require("mqtt")
var client = mqtt.connect("mqtt://localhost", {
    clientId: "raspberrypi" + Math.random().toString(16).substr(2, 8)
})

client.on("connect", function() {
    client.subscribe("#")
})

client.on("message", function(topic, message) {
    switch (topic) {
        case "power/W":
            var dataW = Number(message.toString())
            child.stdin.write("update " + __dirname + "/hem-w.rrd N:" + dataW + "\n")
            break
        case "water/GPM":
            var dataGPM = Number(message.toString())
            child.stdin.write("update " + __dirname + "/hem-gpm.rrd N:" +
                dataGPM + "\n")
            break
        case "temp/tempF":
            var dataF = Number(message.toString())
            child.stdin.write("update " + __dirname + "/hem-in.rrd N:" +
                dataF + "\n")
            break
        case "temp/dewF":
            var dataDew = Number(message.toString())
            child.stdin.write("update " + __dirname + "/hem-dew.rrd N:" +
                dataDew + "\n")
            break
        case "temp/rh":
            var dataRH = Number(message.toString())
            child.stdin.write("update " + __dirname + "/hem-rh.rrd N:" +
                dataRH + "\n")
            break
        case "temp/280049724c2001be":
            var dataOut = Number(message.toString())
            child.stdin.write("update " + __dirname + "/hem-out.rrd N:" +
                dataOut + "\n")
            break
        case "temp/2809853f030000a7":
            var dataUpper = Number(message.toString())
            child.stdin.write("update " + __dirname + "/hem-upper.rrd N:" +
                dataUpper + "\n")
            break
        case "temp/2813513f03000072":
            var dataLower = Number(message.toString())
            child.stdin.write("update " + __dirname + "/hem-lower.rrd N:" +
                dataLower + "\n")
            break
        case "temp/289fa756b5013c68":
            var dataACHigh = Number(message.toString())
            child.stdin.write("update " + __dirname + "/hem-achigh.rrd N:" +
                dataACHigh + "\n")
            break
        case "temp/2874913c46200105":
            var dataACLow = Number(message.toString())
            child.stdin.write("update " + __dirname + "/hem-aclow.rrd N:" +
                dataACLow + "\n")
            break
        case "hvac/state":
            if (message.toString() == "Heating" || message.toString() == "HeatOn") {
                child.stdin.write("update " + __dirname + "/hem-heat.rrd N:100\n")
            } else {
                child.stdin.write("update " + __dirname + "/hem-heat.rrd N:0\n")
            }
            if (message.toString() == "Cooling" || message.toString() == "CoolOn") {
                child.stdin.write("update " + __dirname + "/hem-cool.rrd N:100\n")
            } else {
                child.stdin.write("update " + __dirname + "/hem-cool.rrd N:0\n")
            }
            break
    }

    topic = topic.split("/").join("-");

    if (topic.indexOf("hvac-state") > -1) {
        if (message.toString() == "Cooling" || message.toString() == "CoolOn") {
            updateCnt(leveldb, "hvac-cool", 0.25);
            let key = "hvac-cool-28-" + getMonthBucket();
            leveldb.get(key, function(error, data) {
                if (!error || typeof data === 'number') {
                    client.publish("hvac/coolTime", data.toFixed(2));
                }
            })
        } else if (message.toString() == "Heating" || message.toString() == "HeatOn") {
            updateCnt(leveldb, "hvac-heat", 0.25);
            let key = "hvac-heat-28-" + getMonthBucket();
            leveldb.get(key, function(error, data) {
                if (!error || typeof data === 'number') {
                    client.publish("hvac/heatTime", data.toFixed(2));
                }
            })
        }
    } else if (topic.indexOf("power-W") > -1) {
        insertNow(leveldb, topic, message)
        insertAvg(leveldb, topic, message)
        updateCnt(leveldb, "power-kWh", 0.001);
        let key = "power-kWh-28-" + getMonthBucket();
        leveldb.get(key, function(error, data) {
            if (!error || typeof data === 'number') {
                client.publish("power/kWh", data.toFixed(3));
            }
        })
    } else if (topic.indexOf("water-GPM") > -1) {
        insertNow(leveldb, topic, message)
        insertAvg(leveldb, topic, message)
        updateCnt(leveldb, "water-Gal", 0.25)
        let key = "water-Gal-28-" + getMonthBucket();
        leveldb.get(key, function(error, data) {
            if (!error || typeof data === 'number') {
                client.publish("water/Gal", data.toFixed(2))
            }
        })
    } else if (topic.indexOf("temp-") > -1) {
        insertNow(leveldb, topic, message)
        insertAvg(leveldb, topic, message)
    }
})

function getMonthBucket() {
    let month;
    if (new Date().getDate() > 6) {
        month = new Date().getMonth();
    } else {
        month = new Date().getMonth() - 1;
    }
    return new Date(new Date().getFullYear(), month, 7).getTime();
}

function insertNow(db, topic, message) {
    let key = topic + "-00-" + Date.now();
    db.put(key, Number(message))
}

function insertAvg(db, topic, message) {
    let buckets = [
        ["01", Math.floor(Date.now() / (1 * 60 * 1000)) * 1 * 60 * 1000],
        ["05", Math.floor(Date.now() / (5 * 60 * 1000)) * 5 * 60 * 1000],
        [15, Math.floor(Date.now() / (15 * 60 * 1000)) * 15 * 60 * 1000],
        [60, Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000],
        [24, new Date().setHours(0, 0, 0, 0)],
        [28, getMonthBucket()]
    ];

    buckets.forEach(function(currentValue) {
        let key = topic + "-" + currentValue[0] + "-" + currentValue[1];
        db.get(key, function(error, data) {
            if (error) {
                db.put(key, [
                    1,
                    Number(message),
                    Number(message),
                    Number(message)
                ])
            } else {
                data[0] += 1
                data[1] += Number(message)
                data[2] = Math.min(data[2], Number(message))
                data[3] = Math.max(data[3], Number(message))
                db.put(key, data)
            }
        })
    })
}

function updateCnt(db, topic, incValue) {
    let buckets = [
        ["01", Math.floor(Date.now() / (1 * 60 * 1000)) * 1 * 60 * 1000],
        ["05", Math.floor(Date.now() / (5 * 60 * 1000)) * 5 * 60 * 1000],
        [15, Math.floor(Date.now() / (15 * 60 * 1000)) * 15 * 60 * 1000],
        [60, Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000],
        [24, new Date().setHours(0, 0, 0, 0)],
        [28, getMonthBucket()]
    ];

    buckets.forEach(function(currentValue) {
        let key = topic + "-" + currentValue[0] + "-" + currentValue[1];
        db.get(key, function(error, data) {
            if (error) {
                db.put(key, incValue)
            } else {
                db.put(key, Number(Number(data + incValue).toFixed(3)))
            }
        })
    })
}

const intervalObj = setInterval(() => {
    leveldb.createKeyStream()
    .on('data', function (data) {
        let split = data.split("-")
        if (split[2] == "00") {
            if (Number(split[3]) < Date.now() - 48 * 60 * 60 * 1000){
                leveldb.del(data)
            }
        }
    })

  }, 30 * 60 * 1000);


//   const intObj = setInterval(() => {
//     leveldb.createKeyStream()
//     .on('data', function (data) {
//         let split = data.split("-")
//         if (split[2] == "01") {
//                 console.log("Delete " + split[0] + " " + Number(split[3]))
//                 leveldb.del(data)
//         }
//     })

//   }, 5000);
