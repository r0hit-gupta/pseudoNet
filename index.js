var cheerio = require('cheerio');
var request = require('request');

var express = require('express');
var app = express();
var path = require("path");
app.use(express.static(__dirname + '/src'));

const NEWLINE = '\n';

// FUNCTION TO GET LATTITUDE LONGITUDE FOR A PLACE
function getCoords(place, callback){
  // Google Maps API Key
  const API_KEY = 'AIzaSyAtx_lIJ0GsFLKtlaCsMyo7K7Rq8IeTCx4';
  var url = 'https://maps.googleapis.com/maps/api/geocode/json?address='+place+'&key='+API_KEY;
  request.get(url, function(req, res, body){
    body = JSON.parse(body);
    if (body.results){
      var coords = {};
      coords.lat = body.results[0].geometry.location.lat;
      coords.lng = body.results[0].geometry.location.lng;
      console.log("COORDS " + coords.lat);
      callback(coords);
    }
  });
}

// ENDPOINT FOR WEATHER
app.get('/weather/:city', function (req, res) {
  // openweathermap API key
  const appid = 'ca6ff81b256ad199b3de759c58de182b';
  // Set City
  var city = req.params.city;
  // Create a GET url with the parameters
  var url = 'http://api.openweathermap.org/data/2.5/weather?units=metric&appid=' + appid + '&q=' + city;
  // Get weather details
  request.get(url, function(error, response, body){
      body = JSON.parse(body);
      var sms = 'City: ' + body.name + ', ' + NEWLINE;
          sms += 'Temp: ' + body.main.temp + " C, " + NEWLINE;
          sms += 'Weather: ' + body.weather[0].main;
      res.send(sms);
  });
});

// ENDPOINT FOR NEARBUY PLACES
app.get('/nearby/:place', function (req, res) {
  // Google Places API key
  const API_KEY = 'AIzaSyCdW8DZofdjeJfGNI6jJ1SP5cj3bABLcnI';
  // Set City
  var place = req.params.place;
  var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?key=' + API_KEY + '&query=' + place;
  // Get weather details
  request.get(url, function(error, response, body){
      body = JSON.parse(body);
      var places = 'nearby: ';
      // Length of the results
      var length = body.results.length;

      // If no results are found
      if(body.results.length == 0){
        res.send("Nothing Found");
      }
      // Limit the search results to 5
      if(body.results.length > 5){
        length = 5;
      }
      // Create a string of the results.
      for(var i = 0; i < length; i++){
        places += body.results[i].name + NEWLINE ;
        places += body.results[i].formatted_address + "," + NEWLINE;

      }
      // Send the results
      res.send(places);
  });
});


// END POINT FOR UBER CAB
app.get('/cab/:start/:end', function (req, res) {
  // Uber Token
    var TOKEN = 'HAt9gID7pnvbLmWxn0cpd_RRjGXOWuJOqWwymqgq';
    getCoords(req.params.start, function(start){
      getCoords(req.params.end, function(end){
        var payload = {
          url: 'https://api.uber.com/v1.2/estimates/price?start_latitude=' + start.lat + '&start_longitude=' + start.lng + '&end_latitude=' + end.lat + '&end_longitude=' + end.lng,
          headers: {
            Authorization: 'Token ' + TOKEN,
            'Accept-Language': 'en_US',
            'Content-Type': 'application/json'
          }
        }
        request.get(payload, function(error, response, body){
          body = JSON.parse(body);
          if(body.prices){
            var prices = body.prices[2];
            var sms = 'cab: Type: ' + prices.display_name + ", " + NEWLINE;
                sms += 'Distance: ' + prices.distance + ' kms,' + NEWLINE;
                sms += 'Estimate: Rs ' + prices.low_estimate + ' - ' + prices.high_estimate + ', ' + NEWLINE;
                sms += 'Duration: ' + prices.duration/60 + ' mins' + NEWLINE;
                res.send(sms);
          }
          res.end("Unable to find cabs");
        });
      });
    });
});


// ENDPOINT FOR NEWS
app.get('/news', function (req, res) {
  var API_KEY = 'cb343274ed4b449a922a85c62521b720';
  var url = 'https://newsapi.org/v1/articles?source=cnbc&apiKey=' + API_KEY;
  request.get(url, function(error, response, body){
    body = JSON.parse(body);
    var articles = body.articles;

    if(articles){
      // Limit the news to 5
      var length = articles.length;
      if(length > 5){
        length = 5;
      }
      var sms = 'news: ';
        for(var i = 0; i < length; i++){
          // Send only titles of the news
          sms += i+1 + ". " + articles[i].title + NEWLINE + NEWLINE;
        }
        res.send(sms);
      }
    });
});


// ENDPOINT FOR DIRECTIONS
app.get('/directions/:origin/:destination', function (req, res) {
  var origin = req.params.origin;
  var destination = req.params.destination;
  var url = 'http://maps.googleapis.com/maps/api/directions/json?origin=' + origin + '&destination=' + destination + '&sensor=false';
  request.get(url, function(error, response, body){
    body = JSON.parse(body);
    var sms = '';
    var directions = body.routes[0].legs[0].steps;
    if (directions){
      for(var i = 0; i < directions.length; i++){
        sms += cheerio.load(directions[i].html_instructions).text() + '<br>';
      }
    }

    res.send(sms);
  });
});
// Server Port Setup
app.listen(process.env.PORT || 3000, function () {
  console.log('Now listening on port 3000');
});
