var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://localhost', {
    clientId: 'mongoinsert' + Math.random().toString(16).substr(2, 8)
});

client.on('connect', function() {
    client.subscribe('#');
});

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/hem';


MongoClient.connect(url, function(err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    }

    client.on('message', function(topic, message) {
      topic = topic.split('/').join('-');

      if (topic.indexOf('hvac-state') > -1) {
//        if (message.indexOf('CoolOn') > -1 || message.indexOf('Cooling') > -1) {
//          updateCnt(db, 'hvac-cool', 0.25);
//        } else if (message.indexOf('HeatOn') > -1 || message.indexOf('Heating') > -1) {
//          updateCnt(db, 'hvac-heat', 0.25);
//        }
      } else if (topic.indexOf('power-W') > -1) {
//        insertNow(db, topic, message);
//        insertAvg(db, topic, message);
        updateCnt(db, 'power-kWh', 0.001);
        db.collection('power-kWh-28')
          .find({t : getMonthBucket()})
          .toArray(function(err, result){
            if(result.length === 1){
              client.publish('power/kWh', result[0].d.toFixed(3));
            }
          });
      } else if (topic.indexOf('water-GPM') > -1) {
//        insertNow(db, topic, message);
//        insertAvg(db, topic, message);
        updateCnt(db, 'water-Gal', 0.25);
        db.collection('water-Gal-28')
          .find({t : getMonthBucket()})
          .toArray(function(err, result){
            if(result.length === 1){
              client.publish('water/Gal', result[0].d.toFixed(3));
            }
          });
      } else if (topic.indexOf('temp-') > -1) {
//        insertNow(db, topic, message);
//        insertAvg(db, topic, message);
      }
    });
});

function insertNow(db, topic, message) {
  db.collection(topic).insert({
      t: Date.now(),
      d: Number(message)
  });
}

function getMonthBucket() {
    var month;
    if (new Date().getDate() > 6) {
        month = new Date().getMonth();
    } else {
        month = new Date().getMonth() - 1;
    }
    return new Date(new Date().getFullYear(), month, 7).getTime();
}

function insertAvg(db, topic, message) {
  var buckets = [
    [5, Math.floor(Date.now() / (5 * 60 * 1000)) * 5 * 60 * 1000],
    [15, Math.floor(Date.now() / (15 * 60 * 1000)) * 15 * 60 * 1000],
    [60, Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000],
    [24, new Date().setHours(0, 0, 0, 0)],
    [28, getMonthBucket()]
  ];

  buckets.forEach(function(currentValue){
    db.collection(topic + '-' + currentValue[0]).update({
        t: currentValue[1]
    }, {
        $inc: {
            acc: Number(message),
            cnt: 1
        },
        $min: {
            min: Number(message)
        },
        $max: {
            max: Number(message)
        }
    }, {
        upsert: true
    }, function(err) {
        if (err) {
            console.log(err);
        }
    });
  });
}

function updateCnt(db, topic, message) {
  var buckets = [
//    [5, Math.floor(Date.now() / (5 * 60 * 1000)) * 5 * 60 * 1000],
//    [15, Math.floor(Date.now() / (15 * 60 * 1000)) * 15 * 60 * 1000],
//    [60, Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000],
//    [24, new Date().setHours(0, 0, 0, 0)],
    [28, getMonthBucket()]
  ];

  buckets.forEach(function(currentValue){
    db.collection(topic + '-' + currentValue[0]).update({
        t: currentValue[1]
    }, {
        $inc: {
            d: Number(message)
        }
    }, {
        upsert: true
    }, function(err) {
        if (err) {
            console.log(err);
        }
    });
  });
}
