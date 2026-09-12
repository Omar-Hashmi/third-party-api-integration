const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { weatherApiKey, weatherLocation } = require('./config');
const { DeliveryWeatherService } = require('./weather');

const weather = new DeliveryWeatherService({ apiKey: weatherApiKey, location: weatherLocation });
const books = [
  { title: 'The Midnight Library', author: 'Matt Haig', price: '$14.99' },
  { title: 'Klara and the Sun', author: 'Kazuo Ishiguro', price: '$16.50' },
  { title: 'Project Hail Mary', author: 'Andy Weir', price: '$18.00' }
];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function page(weatherData) {
  const temperature = weatherData.temperatureC === null ? '' : ` · ${escapeHtml(weatherData.temperatureC)}°C`;
  const status = weatherData.source === 'live' ? 'Live delivery weather' : weatherData.source === 'cache' ? 'Cached delivery weather' : 'Delivery weather unavailable';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Papertrail Books</title><link rel="stylesheet" href="/styles.css"></head><body><header><a class="brand" href="/">Papertrail <i>Books</i></a><nav><a href="#books">Browse</a><a href="#delivery">Delivery</a><button class="bag" type="button">Bag <span>0</span></button></nav></header><main><section class="hero"><div><p class="eyebrow">Curated for slow mornings</p><h1>Stories worth<br><em>staying up for.</em></h1><p>Thoughtful books for curious people, chosen by a tiny independent shop.</p><a class="shop-link" href="#books">Explore the shelf <span>→</span></a></div><div class="hero-art" aria-hidden="true"><span>Papertrail<br>Reading Club</span></div></section><section class="weather" id="delivery" aria-label="Delivery conditions"><p class="eyebrow">${status}</p><h2>${escapeHtml(weatherData.location)}</h2><p>${escapeHtml(weatherData.condition)}${temperature}</p><small>Weather refreshes at most once every 15 minutes.</small></section><div class="section-heading"><div><p class="eyebrow">The shelf</p><h2>Featured books</h2></div><a href="#books">View all →</a></div><section class="books" id="books">${books.map((book, index) => `<article><div class="cover cover-${index}"><span>${index === 0 ? 'The\nMidnight\nLibrary' : index === 1 ? 'Klara\nand the\nSun' : 'Project\nHail\nMary'}</span></div><p class="book-author">${escapeHtml(book.author)}</p><h3>${escapeHtml(book.title)}</h3><div class="book-bottom"><strong>${book.price}</strong><button aria-label="Add ${escapeHtml(book.title)} to bag">+</button></div></article>`).join('')}</section></main><footer>Papertrail Books <span>•</span> Made for readers</footer></body></html>`;
}

function createApp({ weatherService = weather } = {}) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (request.method === 'GET' && url.pathname === '/styles.css') {
      response.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
      return response.end(fs.readFileSync(path.join(__dirname, '../public/styles.css')));
    }
    if (request.method === 'GET' && url.pathname === '/') {
      const conditions = await weatherService.getConditions();
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return response.end(page(conditions));
    }
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  });
}

if (require.main === module) createApp().listen(3000, () => console.log('Bookshop running at http://localhost:3000'));

module.exports = { createApp };
