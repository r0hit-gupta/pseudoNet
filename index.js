var cheerio = require('cheerio');
var request = require('request');

var express = require('express');
var app = express();
var path = require("path");
app.use(express.static(__dirname + '/src'));

// FUNCTION TO GET LATTITUDE LONGITUDE FOR A PLACE
function getCoords(place){
  // Google Maps API Key
  const API_KEY = 'AIzaSyAtx_lIJ0GsFLKtlaCsMyo7K7Rq8IeTCx4';
  var url = 'https://maps.googleapis.com/maps/api/geocode/json?address='+place+'&key='+API_KEY;
  request.get(url, function(req, res, body){
    body = JSON.parse(body);
    if (body.results){
      var coords = {};
      coords.lat = body.results[0].geometry.location.lat;
      coords.lng = body.results[0].geometry.location.lng;
      return coords;
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
  request.get(url, function(request, response, body){
      body = JSON.parse(body);
      var sms = 'City: ' + body.name;
          sms += ',%0ATemp: ' + body.main.temp + " C,%0A";
          sms += 'Weather: ' + body.weather[0].description;
      res.send(sms);
  });
});

// ENDPOINT FOR NEARBUY PLACES
app.get('/nearbuy/:place', function (req, res) {
  // Google Places API key
  const API_KEY = 'AIzaSyCdW8DZofdjeJfGNI6jJ1SP5cj3bABLcnI';
  // Set City
  var place = req.params.place;
  var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?key=' + API_KEY + '&query=' + place;
  // Get weather details
  request.get(url, function(request, response, body){
      body = JSON.parse(body);
      var places = '';
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
        places += body.results[i].name + "\n";
        places += body.results[i].formatted_address + ", ";

      }
      // Send the results
      res.send(places);
  });

});

// Server Port Setup
app.listen(process.env.PORT || 3000, function () {
  console.log('Now listening on port 3000');
});
