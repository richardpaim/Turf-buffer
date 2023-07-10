
const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 11,
 attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

const googleSat = L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
  maxZoom: 20,
  subdomains: ["mt0", "mt1", "mt2", "mt3"],
  attribution: "&copy; OpenStreetMap contributors",
});

var map = L.map('map', {
  center: [-15.4150, -55.9681],
  zoom: 4,
  layers: [osm]
});

// Criando os pontos e adicionando-os ao mapa
var features = turf.featureCollection([
  turf.point([-34.9724, -8.3952], {"name": "Refinaria: Abreu e Lima - Ipojuca-PE" }),
  turf.point([-43.2699, -22.7199], {"name": "Refinaria: Duque de Caxias" }),
  turf.point([-44.0962, -19.9756], {"name": "Refinaria: Gabriel Passos - Betim-BH" }),
  turf.point([-49.3607, -25.5679], {"name": "Refinaria: Presidente Getúlio Vargas - Araucária-PR" }),
  turf.point([-38.5718, -12.7076], {"name": "Refinaria: Landulpho Alves - São Francisco do Conde-BH" }),
  turf.point([-59.9538, -3.1464],  {"name": "Refinaria: Isaac Sabbá - Manaus-AM" }),
  turf.point([-51.1627, -29.8716 ], {"name": "Refinaria: Alberto Pasqualini - Canoas-RS - Esteio-RS"}),
  turf.point([-45.8242, -23.1930 ], {"name": "Refinaria: Henrique Lage - São José dos Campos-SP"}),
  turf.point([-46.4802, -23.6394 ], {"name": "Refinaria: Capuava - Mauá-SP"}),
  turf.point([-46.4329, -23.8722 ], {"name": "Refinaria: Presidente Bernardes - Cubatão-SP"}),
  turf.point([-47.1315, -22.7282 ], {"name": "Refinaria: Planalto de Paulínia - Paulínia-SP"}),
]);

// // Populando a tabela com os nomes das refinarias
// var tbody = document.querySelector('.list_refinarias');
// features.features.forEach(function(feature, index) {
//   var tr = document.createElement('tr');
//   var td = document.createElement('td');
//   td.textContent = feature.properties.name;

//   td.addEventListener('click', function() {
//     var pointLayer = L.geoJSON(feature).addTo(map);
//   });

//   tr.appendChild(td);
//   tbody.appendChild(tr);
// });




// Definindo os tamanhos dos buffers
var bufferSizes = [1, 2, 6, 20]; // Em quilômetros

// Função para verificar se um evento está dentro de algum buffer
function isEventInBuffer(event, buffers) {
  for (var i = 0; i < buffers.features.length; i++) {
    var buffer = buffers.features[i];
    if (turf.booleanContains(buffer, event)) {
      return true;
    }
  }
  return false;
}

// Função para criar a camada de eventos filtrados e adicioná-la ao mapa
function createFilteredLayer(data, buffered) {
  var filteredEvents = turf.featureCollection(data.features.filter(function(feature) {
    return isEventInBuffer(feature, buffered);
  }));

  var geojsonLayer = L.geoJSON(filteredEvents, {
    style: {
      color: 'red',
      weight: 1,
      opacity: 0.6,
      fillOpacity: 0.8
    }
  }).addTo(map);
}

// Mostrar o elemento de loading
document.getElementById('loading').style.display = 'flex';

// Criando os parâmetros de data na URL
var params = new URLSearchParams();
params.append('service', 'WFS');
params.append('version', '1.0.0');
params.append('request', 'GetFeature');
params.append('typeName', 'painel_do_fogo:mv_evento_filtro');
params.append('outputFormat', 'application/json');
// params.append('CQL_FILTER', `dt_minima >= '2020-06-01T00:00:00.000Z' AND dt_maxima <= '2020-06-31T23:59:59.999Z'`);

fetch(`https://panorama.sipam.gov.br/geoserver/painel_do_fogo/ows?${params.toString()}`)
  .then(function(response) {
    return response.json();
  }).then(function(data) {
    document.getElementById('loading').style.display = 'none';
    // Create buffers for the features
    var buffered = turf.buffer(features, bufferSizes[bufferSizes.length - 1], { units: 'kilometers' });

    // Criando os buffers e adicionando-os ao mapa
    bufferSizes.forEach(function(size) {
      var buffer = turf.buffer(features, size, { units: 'kilometers' });
      var bufferLayer = L.geoJSON(buffer, {
        style: {
          weight: 2,
          opacity: 0.6,
          fillOpacity: 0.2
        }
      }).addTo(map);
    });

   // Populando a tabela com os nomes das refinarias
var tbody = document.querySelector('.list_refinarias');
features.features.forEach(function(feature, index) {
  var tr = document.createElement('tr');
  var td = document.createElement('td');
  td.textContent = feature.properties.name;

  var centroid = turf.centroid(feature);
  var distance = 0;

  if (index === 1) {
    // Verificar se há eventos apenas para o índice 8 (Henrique Lage)
    if (isEventInBuffer(centroid, buffered)) {
      distance = 20; // Buffer de 20km
      td.classList.add('buffer-20');
    }
  }

  td.addEventListener('click', function() {
    var pointLayer = L.geoJSON(feature).addTo(map);
  // Verificar e limitar o zoom máximo
  if (map.getZoom() > 11) {
    map.setZoom(11);
  }
  map.flyToBounds(pointLayer.getBounds(), { duration: 8 });

  });

  tr.appendChild(td);
  tbody.appendChild(tr);
});

    // Create a layer with filtered events and add it to the map
    createFilteredLayer(data, buffered);
  })
  .catch(function(error) {
    console.error('Error fetching GeoJSON:', error);
    document.getElementById('loading').style.display = 'none';
  });


  
 
  
  
 