let mqtt = require('mqtt');
let client = mqtt.connect('mqtt://localhost', {
    clientId: 'mongoinsert' + Math.random().toString(16).substr(2, 8)
});

client.on('connect', function() {
    client.subscribe('#');
});

let mongodb = require('mongodb');
let MongoClient = mongodb.MongoClient;
let url = 'mongodb://localhost:27017/hem';

let leveldb = require('level')('./hemdb', {
    valueEncoding: 'json'
})

MongoClient.connect(url, function(err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    }

    client.on('message', function(topic, message) {
        topic = topic.split('/').join('-');

        if (topic.indexOf('hvac-state') > -1) {
            if (message.indexOf('CoolOn') > -1 || message.indexOf('Cooling') > -1) {
                updateCnt(leveldb, 'hvac-cool', 0.25);
            } else if (message.indexOf('HeatOn') > -1 || message.indexOf('Heating') > -1) {
                updateCnt(leveldb, 'hvac-heat', 0.25);

                db.collection('hvac-heat-28')
                    .find({
                        t: getMonthBucket()
                    })
                    .toArray(function(err, result) {
                        if (result.length === 1) {
                            client.publish('hvac/heatTime', result[0].d.toFixed(3));
                        }
                    });
            }
        } else if (topic.indexOf('power-W') > -1) {
            insertNow(leveldb, topic, message)
            insertAvg(leveldb, topic, message)
            updateCnt(leveldb, 'power-kWh', 0.001);
            let key = "power-kWh-28-" + getMonthBucket();
            leveldb.get(key, function(error, data) {
                if (!error) {
                    client.publish('power/kWh', data.d.toFixed(3));
                }
            })
        } else if (topic.indexOf('water-GPM') > -1) {
            insertNow(leveldb, topic, message)
            insertAvg(leveldb, topic, message)
            updateCnt(leveldb, 'water-Gal', 0.25)
            db.collection('water-Gal-28')
                .find({
                    t: getMonthBucket()
                })
                .toArray(function(err, result) {
                    if (result.length === 1) {
                        client.publish('water/Gal', result[0].d.toFixed(3));
                    }
                });
        } else if (topic.indexOf('temp-') > -1) {
            insertNow(leveldb, topic, message)
            insertAvg(leveldb, topic, message)
        }
    });
});

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
    let key = topic;

    db.get(key, function(error, data) {
        if (error) {
            db.put(key, [{
                "t": Date.now(),
                "d": Number(message)
            }])
        } else {
            let last = data.push({
                "t": Date.now(),
                "d": Number(message)
            })
            if (((data[last - 1].t - data[0].t) / 1000 / 60 / 60) > 48) data.shift()
            db.put(key, data)
        }
    })
}

function insertAvg(db, topic, message) {
    let buckets = [
        [5, Math.floor(Date.now() / (5 * 60 * 1000)) * 5 * 60 * 1000],
        [15, Math.floor(Date.now() / (15 * 60 * 1000)) * 15 * 60 * 1000],
        [60, Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000],
        [24, new Date().setHours(0, 0, 0, 0)],
        [28, getMonthBucket()]
    ];

    buckets.forEach(function(currentValue) {
        let key = topic + '-' + currentValue[0] + '-' + currentValue[1];
        db.get(key, function(error, data) {
            if (error) {
                db.put(key, {
                    "cnt": 1,
                    "acc": Number(message),
                    "min": Number(message),
                    "max": Number(message)
                })
            } else {
                data.cnt += 1
                data.acc += Number(message)
                data.min = Math.min(data.min, Number(message))
                data.max = Math.max(data.max, Number(message))
                db.put(key, data)
            }
        })
    })
}

function updateCnt(db, topic, incValue) {
    let buckets = [
        [5, Math.floor(Date.now() / (5 * 60 * 1000)) * 5 * 60 * 1000],
        [15, Math.floor(Date.now() / (15 * 60 * 1000)) * 15 * 60 * 1000],
        [60, Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000],
        [24, new Date().setHours(0, 0, 0, 0)],
        [28, getMonthBucket()]
    ];

    buckets.forEach(function(currentValue) {
        let key = topic + '-' + currentValue[0] + '-' + currentValue[1];
        db.get(key, function(error, data) {
            if (error) {
                db.put(key, {
                    "d": 0.001
                })
            } else {
                db.put(key, {
                    "d": Number(Number(data.d + incValue).toFixed(3))
                })
                //console.log(key + " " + JSON.stringify(data))
            }
        })
    })

}