var d3 = require('d3');
var turf = require('turf');

var map = require('./map');
var getPath = require('./getPath');
var zone = require('./index')
var stations = require('../stations');

var cars = {},
  j = 0,
  total = 0,
  current = 0,
  incidents = 0;

module.exports = function(num) {
  for (var i = 0; i < num; i++) {
    getPath().then(function(path_info) {
      cars[++j] = { inside: false, ever: false, color: getRandomColor() };
      var route = turf.linestring(path_info.routes[0].geometry.coordinates);
      createCar(path_info.origin, cars[j].color)
        .transition()
        .duration(15000)
        .attrTween('transform', translateAlong(route, j))
        .remove();
    });
  };
}


function createCar(origin, color) {
  var new_car = d3.select('svg')
    .append('circle')
    .attr('fill', 'black')
    .attr('r', 2)
    .attr('transform', function() {
      var pixelCoords = map.project(origin.geometry.coordinates);
      return 'translate(' + pixelCoords.x + ',' + pixelCoords.y + ')';
    });
  return new_car;
}

function translateAlong(path, j) {
  var l = turf.lineDistance(path, 'kilometers');
  return function(d, i, a) {
    var car = d3.select(this);
    return function(t) {
      // t is time as as % of total transition duration
      var current_car = cars[j];
      var p = turf.along(path, t * l, 'kilometers');
      if (!current_car.inside && turf.inside(p, zone)) {
        current_car.inside = true;
        // car.classed('inzone', true);
        increment('current');
        if (!current_car.ever) {
          // addNotification(current_car.color, j, 'enter');
          current_car.ever = true;
          // car.classed('enter', true);
          increment('total');
          aqIncrement(p);
        }
      } else if (current_car.inside && !turf.inside(p, zone)) {
        // addNotification(current_car.color, j, 'exit');

        // car.classed('inzone', false);
        // car.classed('enter', false);
        current_car.inside = false;
        decrement('current');
      } else if (current_car.inside && turf.inside(p, zone)) {
        aqIncrement(p);
      }
      if (t === 1) {
        delete current_car;
        if (turf.inside(p, zone)) {
          decrement('current');
        }
      }
      var p = turf.along(path, t * l, 'kilometers');
      var pixelCoords = map.project(p.geometry.coordinates);
      return 'translate(' + pixelCoords.x + ',' + pixelCoords.y + ')';
    };
  };
}

var ticker = d3.selectAll('.ticker');

function aqIncrement(point) {
  // Check our stations, if point is within distance of it, increment source data
  Object.keys(stations).forEach(function (k) {
    if (turf.distance(point, turf.point([stations[k].coordinates.longitude, stations[k].coordinates.latitude]), 'kilometers') < 0.5) {
      stations[k].value += 1;
      if (stations[k].value === 20 || stations[k].value === 50) {
        increment('incidents');
        addNotification(stations[k].value === 20 ? '#ECEC00' : 'red', k, 'start');
      }
      var geojson = map.createStationsGeoJSON(stations);
      map.getSource('stations').setData(geojson.data);
      // And set something to decrement in a bit
      setTimeout(function () {
        var newVal = stations[k].value - 1;
        stations[k].value = newVal < 0 ? 0 : newVal;
        var geojson = map.createStationsGeoJSON(stations);
        map.getSource('stations').setData(geojson.data);
        if (stations[k].value === 19) {
          addNotification('green', k, 'end');
        }
      }, 5000);
    }
  });
}


function addNotification(color, location, type) {

  var notification_types = { start: { alert: '! Alert', message: 'starting' }, end: { alert: '✓ Alert', message: 'ending' } };

  var html = '<strong class="strongpad" style="background:' + color + '"">' + notification_types[type].alert + '</strong> Air quality incident is <strong>' + notification_types[type].message + '</strong> at <strong>' + location + '</strong>.'
  ticker.insert('div', ':first-child').html(html).classed('expanded', true);
}



function getRandomColor() {
  var colors = d3.scale.category10().range();
  var max = colors.length;
  return colors[Math.floor(Math.random() * max)];
}

var metrics = { 'incidents': incidents, 'current': current, 'total': total };

function increment(metric) {
  d3.selectAll('.' + metric + '-vehicles').text(++metrics[metric]);
  if (metric === 'incidents') {
    d3.selectAll('.total-incidents').text(metrics[metric]);
  }
}

function decrement(metric) {
  d3.selectAll('.' + metric + '-vehicles').text(--metrics[metric]);
}
