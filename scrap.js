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

var sumRH = [];
function trendRH(data){
  if (sumRH.push(data) > 120){
    sumRH.shift();
  };
  var total=0
  for (index = 0; index < sumRH.length; index++) {
      total += sumRH[index];
  }
  child.stdin.write('update ' + __dirname + '/hem-rh2.rrd N:' + (total/sumRH.length).toFixed(1) + '\n');
  eventEmitter.emit('TRENDrh',(total/sumRH.length).toFixed(1));
  io.emit('TRENDrh',(total/sumRH.length).toFixed(1));
};
eventEmitter.on('RH', trendRH);

      arg.push('DEF:rh2=' + __dirname + '/hem-rh2.rrd:rh:AVERAGE');
      arg.push('LINE1:rh2#00ffff:Relative_Humidity_Trend');
      arg.push('DEF:dew2=' + __dirname + '/hem-dew2.rrd:dew:AVERAGE');
      arg.push('LINE1:dew2#ff00ff:Dew_Point_Trend');



      iosocket.on('TREND', function(message){
        $('#trend').html('Trend: ' + message + 'F<br>');
      iosocket.on('TRENDrh', function(message){
        $('#trendrh').html('Trend: ' + message + 'F<br>');
      });
  <span id='trend'></span>
  <span id='trendrh'></span>
  


  
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
