var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/hem';


MongoClient.connect(url, function(err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    }

    db.listCollections().toArray(function(err, collInfos) {
        collInfos.forEach(function(element, index) {
            if (element.name != "system.indexes") {
                var splitted = element.name.split("-");
                if (splitted.length == 2) {
                    db.collection(element.name)
                        .deleteMany({t: {
                            $lt: Date.now() - 2 * 24 * 60 * 60 * 1000
                        }}, function(err, obj) {
                            if (err) throw err;
                            if (obj.result.n != 0) {
                                console.log(obj.result.n + " document(s) deleted from " + element.name);
                            }
                        });
                } else if (splitted.length == 3) {
                    switch (splitted[2]) {
                        case '5':
                            db.collection(element.name)
                            .deleteMany({t: {
                                $lt: Date.now() - 5 * 24 * 60 * 60 * 1000
                            }}, function(err, obj) {
                                if (err) throw err;
                                if (obj.result.n != 0) {
                                    console.log(obj.result.n + " document(s) deleted from " + element.name);
                                }
                            });
                            break;
                        case '15':
                            db.collection(element.name)
                            .deleteMany({t: {
                                $lt: Date.now() - 14 * 24 * 60 * 60 * 1000
                            }}, function(err, obj) {
                                if (err) throw err;
                                if (obj.result.n != 0) {
                                    console.log(obj.result.n + " document(s) deleted from " + element.name);
                                }
                            });
                            break;
                        case '60':
                            db.collection(element.name)
                            .deleteMany({t: {
                                $lt: Date.now() - 28 * 24 * 60 * 60 * 1000
                            }}, function(err, obj) {
                                if (err) throw err;
                                if (obj.result.n != 0) {
                                    console.log(obj.result.n + " document(s) deleted from " + element.name);
                                }
                            });
                            break;
                        case '24':
                            break;
                        case '28':
                            break;
                    }
                }
            }
            if (index == collInfos.length - 1) {
                db.close();
                process.exit();
            }
        });
    });
});
