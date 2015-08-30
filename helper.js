//Time helper functions
exports.time15m = function(){
  return Math.floor((Date.now()/1000)/(15*60))*15*60*1000;
}
exports.time60m = function(){
  return Math.floor((Date.now()/1000)/(60*60))*60*60*1000;
}
exports.time24h = function(){
  return new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()).getTime();
}
exports.time28d = function(){
  var month;
  new Date().getDate() > 6 ? month = new Date().getMonth() : month = new Date().getMonth() - 1
  return new Date(new Date().getFullYear(),month,7).getTime();
}
exports.time7dAgo = function(){
  return Date.now()-7*24*60*60*1000;
}
exports.time1dAgo = function(){
  return Date.now()-24*60*60*1000;
}
exports.time4hAgo = function(){
  return Date.now()-4*60*60*1000;
}

//Leveldb helper functions

//incCounter(leveldb,'HEM!kWh!',time15(),2);
exports.incCounter = function(db,prefix,timeStamp,incValue){
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

exports.storeAvg = function(db,prefix,timeStamp,value){
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
exports.purgeDB = function(db,prefix,timeStamp){
  db.createReadStream({start:prefix,end:prefix+timeStamp,values:false})
    .on('data',function(data){
      db.del(data);
    })
}

//
exports.readDB = function(db,prefix,res){
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

exports.message = function(message){
  // send mail with defined transport object
  mailOptions.text = message;
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
          return console.log(error);
      }
      console.log('Message sent: ' + info.response);

  });
}
