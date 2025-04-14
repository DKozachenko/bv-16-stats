const DATA_FILE = 'data/data.json';

// Coordinates for the approximate center of Russia's populated regions
// [longitude, latitude] - MapLibre uses [lng, lat] format
const RUSSIA_CENTER_COORDINATES = [82.0, 58.0]; // Near Novosibirsk, better coverage of populated areas

// Map boundaries
// [longitude, latitude] - MapLibre uses [lng, lat] format
const MAP_SOUTHWEST_BOUNDS = [-9.3, 36.0]; // Most southwestern point of Spain
const MAP_NORTHEAST_BOUNDS = [190.0, 82.0]; // Far East

const HEATMAP_COLORS = {
  0: '#0000FF00',  // Transparent Blue
  0.2: '#00FFFFC0',  // Cyan
  0.4: '#00FF00C0',  // Green
  0.6: '#FFFF00C0',  // Yellow
  0.8: '#FFA500C0',  // Orange
  1: '#FF0000C0'     // Red
};

async function fetchData() {
  try {
    const response = await fetch(DATA_FILE);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading data:', error);
    return { cities: [], participants: [] };
  }
}

function updateStats(participants, cities) {
  const statsContainer = document.getElementById('stats');
  const tbody = statsContainer.querySelector('.stats-body');
  tbody.innerHTML = '';

  // Count participants per city
  const cityStats = participants.reduce((acc, participant) => {
    const city = cities.find(c => c.id === participant.city_id);
    if (city) {
      acc[city.name] = (acc[city.name] ?? 0) + 1;
    }
    return acc;
  }, {});

  // Sort cities by number of participants (descending)
  const sortedCities = Object.entries(cityStats)
    .sort((a, b) => b[1] - a[1]);

  // Add rows to the table
  sortedCities.forEach(([city, count]) => {
    const row = document.createElement('tr');
    row.className = 'stats-row';
    row.innerHTML = `
      <td>${city}</td>
      <td>${count}</td>
    `;
    tbody.appendChild(row);
  });
}

function addParticipantsSource(map, participants, cities) {
  const features = participants.map(participant => {
    const city = cities.find(c => c.id === participant.city_id);
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: city ? city.coordinates : [0, 0]
      }
    };
  });

  map.addSource('participants', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: features
    }
  });
}

function addHeatmapLayer(map) {
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
        ...Object.entries(HEATMAP_COLORS)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([stop, color]) => [Number(stop), color])
          .flat()
      ],
      'heatmap-radius': 30,
      'heatmap-opacity': 0.8
    }
  });
}

function initializeMap() {
  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/streets/style.json?key=xQmnB8CNEr2OP6dEg5Du',
    center: RUSSIA_CENTER_COORDINATES,
    zoom: 0 // Minimum zoom to show maximum area
  });

  map.setMaxBounds([
    MAP_SOUTHWEST_BOUNDS,
    MAP_NORTHEAST_BOUNDS
  ]);

  return map;
}

async function initializeApp() {
  const { cities, participants } = await fetchData();
  const map = initializeMap();
  map.on('load', () => {
    addParticipantsSource(map, participants, cities);
    addHeatmapLayer(map);
  });
  updateStats(participants, cities);
}

initializeApp();
