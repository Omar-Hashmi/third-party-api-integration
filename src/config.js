const fs = require('node:fs');
const path = require('node:path');

function loadEnv(file = path.join(__dirname, '..', '.env')) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}

loadEnv();

module.exports = {
  weatherApiKey: process.env.WEATHER_API_KEY || '',
  weatherLocation: process.env.WEATHER_LOCATION || 'Lahore'
};
