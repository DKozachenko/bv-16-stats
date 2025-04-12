const DATA_FILE = 'data/participants.json';

const MOSCOW_COORDINATES = [37.6173, 55.7558];

const HEATMAP_COLORS = {
  0: '#0000FF00',
  0.2: '#0000FF33',
  0.4: '#00FFFF66',
  0.6: '#00FF0099',
  0.8: '#FFFF00CC',
  1: '#FF0000FF'
};

function processParticipantsData(data) {
  return data.participants;
}

function initializeMap() {
  return new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/streets/style.json?key=xQmnB8CNEr2OP6dEg5Du',
    center: MOSCOW_COORDINATES,
    zoom: 4
  });
}

function addParticipantsSource(map, participants) {
  map.addSource('participants', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: participants.map(participant => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: participant.coordinates
        },
        properties: {
          name: participant.name,
          city: participant.city
        }
      }))
    }
  });
}

function addHeatmapLayer(map) {
  // We need to use parseFloat because Object.keys() returns strings,
  // and we need to sort them numerically for the interpolate expression
  const colorStops = Object.entries(HEATMAP_COLORS)
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    .map(([density, color]) => [parseFloat(density), color]);

  map.addLayer({
    id: 'participants-heat',
    type: 'heatmap',
    source: 'participants',
    paint: {
      'heatmap-weight': 1,
      'heatmap-intensity': 1,
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        ...colorStops.flat()
      ],
      'heatmap-radius': 30,
      'heatmap-opacity': 0.8
    }
  });
}

function displayStatistics(participants) {
  const statsContainer = document.getElementById('stats');
  const cityStats = participants.reduce((acc, participant) => {
    const city = participant.city;
    if (!acc[city]) {
      acc[city] = {
        count: 0,
        coordinates: participant.coordinates,
        names: []
      };
    }
    acc[city].count++;
    acc[city].names.push(participant.name);
    return acc;
  }, {});

  Object.entries(cityStats).forEach(([city, stats]) => {
    const statItem = document.createElement('div');
    statItem.className = 'stat-item';
    statItem.innerHTML = `
      <h3>${city}</h3>
      <p>Количество участниц: ${stats.count}</p>
      <p>Участницы: ${stats.names.join(', ')}</p>
    `;
    statsContainer.appendChild(statItem);
  });
}

// Initialize map
const map = initializeMap();

// Load and process participants data
fetch(DATA_FILE)
  .then(response => response.json())
  .then(data => {
    const participants = processParticipantsData(data);

    // Add heatmap layer
    map.on('load', () => {
      addParticipantsSource(map, participants);
      addHeatmapLayer(map);
    });

    // Display statistics
    displayStatistics(participants);
  })
  .catch(error => console.error('Error loading data:', error));
