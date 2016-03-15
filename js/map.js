/* eslint-disable no-loop-func */
mapboxgl.accessToken = 'pk.eyJ1IjoibW9sbHltZXJwIiwiYSI6ImNpazdqbGtiZTAxbGNocm0ybXJ3MnNzOHAifQ.5_kJrEENbBWtqTZEv7g1-w';

var bounds = [
  0.248565673828125,51.33146969705743, // Southwest coordinates
   -0.5005645751953125, 51.65211086156918, // Northeast coordinates
];


var screenWidth = document.documentElement.clientWidth;
var screenHeight = document.documentElement.clientHeight;

// map loads with different zoom / center depending on the type of device
var zoom = screenWidth < 700 ? 10.5 : screenHeight <= 600 || screenWidth < 1000 ? 10.5 : 11.5;
var center = screenWidth < 700 ? [-0.149688720703125,51.48865188163204] : [-0.15003204345703125, 51.50489601254001];


var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mollymerp/cil0726u8005havm1afumdfo8',
  center: center,
  zoom: zoom,
  // hash: true,
  maxBounds: bounds
});

// disable scroll zoom in the blog post iframe
if (screenHeight <= 600) {
  map.scrollZoom.disable();
  map.addControl(new mapboxgl.Navigation({position:'top-left'}))
}

if (map.screenWidth < 700) {
  map.dragPan.disable();
}

map.createStationsGeoJSON = function (data) {
  // Create stations geojson
  var geojson = {
    'type': 'geojson',
    'data': {
      'type': 'FeatureCollection',
      'features': []
    }
  };

  Object.keys(data).forEach(function (k) {
    var s = data[k];
    var f = {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [s.coordinates.longitude, s.coordinates.latitude]
      },
      'properties': {
        'title': k,
        'value': data[k].value
      }
    }
    geojson.data.features.push(f);
  });

  return geojson;
}


module.exports = map;
