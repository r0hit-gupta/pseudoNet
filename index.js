var cheerio = require('cheerio');
var request = require('request');

// Digital Ocean
var DigitalOcean = require('do-wrapper'),
    DO_api = new DigitalOcean('32a262e9c8828bd6f48f3985050b6a91fcf2eef92df2db9c03bb1e32e07909a4', 1);

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
      callback(coords);
    }
  });
}

// FUNCTION TO BEAUTIFY TIMESTAMPS
function formatDate(date, callback) {
  console.log(date);
  date = new Date(date);
  var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var month = monthNames[date.getMonth()];
  var day = date.getDay();
  var hours = parseInt(date.getHours());
  var minutes = date.getMinutes();
  if(hours < 10) hours = '0' + hours;
  if(minutes < 10) minutes = '0' + minutes;
  var date = day + ' ' + month + ' ' + hours + ':' + minutes;
  callback(date);
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
        places += i+1 + ". " + body.results[i].name + NEWLINE ;
        places += body.results[i].formatted_address + NEWLINE + NEWLINE;
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
          var prices = {};
          if(body.prices){
            for (var i = 0; i < body.prices.length; i++) {
              if(body.prices[i].display_name == 'uberGO'){
                prices = body.prices[i];
                var sms = 'cab: Type: ' + prices.display_name + ", " + NEWLINE;
                    sms += 'Distance: ' + prices.distance + ' kms,' + NEWLINE;
                    sms += 'Estimate: Rs ' + prices.low_estimate + ' - ' + prices.high_estimate + ', ' + NEWLINE;
                    sms += 'Duration: ' + prices.duration/60 + ' mins' + NEWLINE;
                    res.send(sms);
                break;
              }
            }

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
    var sms = 'directions: ';
    var directions = [];
    if(body.routes[0]){
      directions = body.routes[0].legs[0].steps;
    }
    else {
      res.send("No directions found");
    }
    if (directions){
      for(var i = 0; i < directions.length; i++){
        sms += cheerio.load(directions[i].html_instructions.replace('<div', '\n<div')).text() + NEWLINE;
      }
    }
    res.send(sms);
  });
});

// ENDPOINT FOR WIKIPEDIA
app.get('/wiki/:query', function (req, res) {
  var query = req.params.query;
  var url = 'https://en.wikipedia.org/wiki/' + query;
  request.get(url, function(error, response, body){
    var $ = cheerio.load(body)
    $('sup').remove();
    body = $('p').first().text();
    res.send('wiki: ' + body);
});
});

// ENDPOINT FOR TRAINS BETWEEN TWO STATIONS
app.get('/trains/:source/:destination/:date', function (req, res) {
  var source = req.params.source;
  var destination = req.params.destination;
  var date = req.params.date;
  var url = 'https://travel.paytm.com/api/trains/v1/search?client=web&departureDate='+ date +'&destination=' + destination + '&source=' + source;
  request.get(url, function(error, response, body){
    body = JSON.parse(body);
    if(body.error == null){
      var trains = body.body.trains;
      if(trains){
        // Limit the trains to 5
        var length = trains.length;
        if(length > 3){
          length = 3;
        }
      var sms = 'trains: '
      for(var i = 0; i < length; i++){
        sms += 'Name: ' + trains[i].trainName + NEWLINE;
        sms += 'Number: ' + trains[i].trainNumber + NEWLINE;
        formatDate(trains[i].departure, function(date){
          sms += 'Departure: ' + date + NEWLINE;
        });
        formatDate(trains[i].arrival, function(date){
          sms += 'Arrival: ' + date + NEWLINE + NEWLINE;
        });
      }
    }}
    res.send(sms);
  });
});

// ENDPOINT FOR BUSES BETWEEN TWO STATIONS
app.get('/bus/:source/:destination/:date', function (req, res) {
  var source = req.params.source;
  var destination = req.params.destination;
  var date = req.params.date;

  var url = 'https://tickets.paytm.com/v2/search?child_site_id=1&site_id=1&client=web';
  request.post({
    url: url,
    json: true,
    body: {
      date: date,
      dest_display_name: destination,
      src_display_name: source
    }
  }, function(error, response, body){
    if(body.error == null){
      var buses = body.body;
      // res.send(buses);
      var length = buses.length;
      if(length > 3){
        length = 3;
      }
      var sms = 'bus: ';
      for(var i = 0; i < length; i++){
        sms += 'Name: ' + buses[i].computedTravelsName + NEWLINE;
        sms += 'Departure: ' + buses[i].departureDate + ' ' + buses[i].departureTime + NEWLINE;
        sms += 'Arrival : ' + buses[i].arrivalDate + ' ' + buses[i].arrivalTime + NEWLINE;
        sms += "Price : Rs " + buses[i].fare[0] + NEWLINE + NEWLINE;
      }
      res.send(sms);
    }
    res.send("No Buses Found");
  });
});

// ENDPOINT FOR FINDING BEST PRICES
app.get('/price/:product', function (req, res) {
  var product = req.params.product;
  var url = 'http://www.mysmartprice.com/msp/search/msp_search_new.php?s=' + product;
  var sms = 'price: ';
  if(product){
    request.get(url, function(error, response, body){
      var $ = cheerio.load(body);
      $('.prdct-item__dtls').each(function(i, ele){
        if(i > 4) {
          return null;
        }
        sms += 'Item: ' + $(this).children('a').text().trim() + NEWLINE;
        sms += 'Price: Rs ' + $(this).children().last().children().last().text() + NEWLINE + NEWLINE;
      });
      res.send(sms);
    });
  }
});


// DEVELOPER COMMUNITY FEATURES
app.get('/ping/:website', function (req, res) {
  var website = 'http://' + req.params.website;
  request.get(website, function(error, response, body){

    if(!error && response){
      if(response.statusCode == 503)
      res.send('Website is down');
      else res.send('Everything seems to be up and running')
    }
    res.send('Unknown website');
  });
});

// DIGITAL OCEAN ENDPOINTS
app.get('/digiocean/droplets/:cmd', function (req, res) {
  var cmd = req.params.cmd;

  // Get all Droplets
  if(cmd == 'getall'){
      DO_api.dropletsGetAll({}, (error, response, body) => {
        var sms = 'getdroplets: ';

        if(body.droplets){
          var droplets = body.droplets;
          for (var i = 0; i < droplets.length; i++) {
            sms += "Name: " + droplets[i].name + NEWLINE;
            sms += "Id: " + droplets[i].id + NEWLINE;
            sms += "Memory: " + droplets[i].memory + NEWLINE;
            sms += 'Status: ' + droplets[i].status + NEWLINE;
            sms += "IP: " + droplets[i].networks.v4[0].ip_address + NEWLINE + NEWLINE;
          }
        }
        res.send(sms);
  });
}
  // Get droplet by ID
  if(cmd == 'getbyid'){
    var id = req.query.id;
    if(id){
      var sms = 'dropletbyid: ';
      DO_api.dropletsGetById(id, (error, response, body) => {
        if(!error){
          sms += 'Id: ' + body.droplet.id + NEWLINE;
          sms += 'Name : ' + body.droplet.name + NEWLINE;
          sms += 'Status: ' + body.droplet.status + NEWLINE;
          sms += 'IP: ' + body.droplet.networks.v4[0].ip_address + NEWLINE;
          res.send(sms);
        }
      });
    }
    else
    res.send('Please provide a valid id');
  }

  // Create droplet
  if(cmd == 'create'){
    var name = req.query.name;
    var region = req.query.region;
    var size = req.query.size;
    var image = req.query.image;

    if(name && region && size && image){
      var sms = 'createdroplet: Droplet created successfully' + NEWLINE;
      var options = {
        name: name,
        region: region,
        size: size,
        image: image
      };
      DO_api.dropletsCreate(options, (error, response, body) => {
        // console.log(error);
        if(error == null){
          sms += 'Id: ' + body.droplet.id + NEWLINE;
          sms += 'Name : ' + body.droplet.name + NEWLINE;
          sms += 'Status: ' + body.droplet.status + NEWLINE;
          res.send(sms);
      }
      });
    }
    else
    res.send("Please send valid options");
  }

  // Delete droplet
  if(cmd == 'delete'){
    var id = req.query.id;
    if(id){
      DO_api.dropletsDelete(id, (error, response, body) => {
       if(response.statusCode == 204){
         res.send("deletedroplet: Droplet deleted successfully");
       }
    });
  }
}

// Droplet Actions
if(cmd == 'action'){
  var id = req.query.id;
  var type = req.query.type;
  if(id){
    var options = {
      type: type
    };
    if(type == 'snapshot'){
      options.name = req.query.name;
    }
    var sms = 'action: '
    DO_api.dropletsRequestAction(id, options, (error, response, body) => {
      sms += 'Action: ' + body.action.type + NEWLINE;
      sms += 'Status: ' + body.action.status + NEWLINE;
      res.send(sms);
  });
}
  else res.send("Please send valid action or id");
}

});

// Server Port Setup
app.listen(process.env.PORT || 3000, function () {
  console.log('Now listening on port 3000');
});
