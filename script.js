// Initialize map
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/streets/style.json?key=xQmnB8CNEr2OP6dEg5Du',
    center: [37.6173, 55.7558], // Moscow coordinates
    zoom: 4
});

// Load participants data
fetch('data/participants.json')
    .then(response => response.json())
    .then(data => {
        const participants = data.participants;
        
        // Group participants by city
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

        // Add heatmap layer
        map.on('load', () => {
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
                        0, 'rgba(0, 0, 255, 0)',
                        0.2, 'rgba(0, 0, 255, 0.2)',
                        0.4, 'rgba(0, 255, 255, 0.4)',
                        0.6, 'rgba(0, 255, 0, 0.6)',
                        0.8, 'rgba(255, 255, 0, 0.8)',
                        1, 'rgba(255, 0, 0, 1)'
                    ],
                    'heatmap-radius': 30,
                    'heatmap-opacity': 0.8
                }
            });
        });

        // Display statistics
        const statsContainer = document.getElementById('stats');
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
    })
    .catch(error => console.error('Error loading data:', error)); 