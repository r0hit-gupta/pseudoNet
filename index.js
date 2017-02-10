var cheerio = require('cheerio');
var request = require('request');

var express = require('express');
var app = express();
var path = require("path");
app.use(express.static(__dirname + '/src'));

app.get('/weather/:city', function (req, res) {
  // openweathermap API key
  const appid = 'ca6ff81b256ad199b3de759c58de182b';
  // Set City
  var city = req.params.city;

  var url = 'http://api.openweathermap.org/data/2.5/weather?units=metric&appid=' + appid + '&q=' + city;
  // Get weather details
  request.get(url, function(request, response, body){
      body = JSON.parse(body);
      var sms = 'City: ' + body.name;
      console.log(sms);
          sms += ',\nTemp: ' + body.main.temp + "C,\n";
          console.log(sms);
          sms += 'Weather: ' + body.weather[0].description;
          console.log(sms);
      res.send(sms);
  });

});



// Server Port Setup
app.listen(3000, function () {
  console.log('Now listening on port 3000');
});
