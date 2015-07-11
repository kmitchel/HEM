var SunCalc = require('suncalc');

var times = SunCalc.getTimes(new Date(), 41.1660, -85.4831)

console.log(times.sunrise.getTime()/1000);
console.log(times.sunset.getTime()/1000);