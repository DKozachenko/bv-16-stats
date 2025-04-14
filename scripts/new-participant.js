const fs = require('fs');
const path = require('path');

function readDataFile() {
  const dataPath = path.join(__dirname, '..', 'data', 'data.json');
  try {
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading data file:', error);
    process.exit(1);
  }
}

function findOrCreateCity(data, cityName) {
  let city = data.cities.find(c => c.name.toLowerCase() === cityName.toLowerCase());

  if (!city) {
    const cityId = Math.max(...data.cities.map(c => c.id), 0) + 1;
    const coordinates = [0, 0]; // Placeholder coordinates

    city = {
      id: cityId,
      name: cityName,
      coordinates: coordinates
    };
    data.cities.push(city);
  }

  return city;
}

function createParticipant(data, participantName, cityId, age) {
  const participantId = Math.max(...data.participants.map(p => p.id), 0) + 1;

  return {
    id: participantId,
    name: participantName,
    age,
    city_id: cityId
  };
}

function saveDataFile(data) {
  const dataPath = path.join(__dirname, '..', 'data', 'data.json');
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data file:', error);
    process.exit(1);
  }
}

// Main script
const args = process.argv.slice(2);
const participantName = args[0];
const cityName = args[1];
const age = parseInt(args[2] ?? 16);

if (!participantName || !cityName) {
  console.error('Usage: node new-participant.js "Participant Name" "City Name" [Age]');
  process.exit(1);
}

const data = readDataFile();
const city = findOrCreateCity(data, cityName);
const newParticipant = createParticipant(data, participantName, city.id, age);
data.participants.push(newParticipant);
saveDataFile(data);

console.log('Successfully added:');
console.log(`Participant: ${participantName}`);
console.log(`Age: ${age}`);
console.log(`City: ${cityName}${!city.coordinates[0] ? ' (needs coordinates)' : ''}`);
