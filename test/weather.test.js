const test = require('node:test');
const assert = require('node:assert/strict');
const { CACHE_TTL_MS, DEFAULT_CONDITIONS, DeliveryWeatherService } = require('../src/weather');
const { createApp } = require('../src/server');

function weatherResponse() {
  return { ok: true, json: async () => ({ location: { name: 'Lahore' }, current: { temp_c: 31, condition: { text: 'Sunny' } } }) };
}

test('uses the live weather response once within the defined 15-minute cache lifetime', async () => {
  let calls = 0;
  const service = new DeliveryWeatherService({ apiKey: 'test-key', location: 'Lahore', fetchFn: async () => { calls += 1; return weatherResponse(); } });
  assert.equal((await service.getConditions()).source, 'live');
  assert.equal((await service.getConditions()).source, 'cache');
  assert.equal(calls, 1);
  assert.equal(CACHE_TTL_MS, 15 * 60 * 1000);
});

test('uses stale cached weather and logs failures when the API becomes unavailable', async () => {
  const messages = [];
  let available = true;
  let clock = 0;
  const service = new DeliveryWeatherService({ apiKey: 'test-key', location: 'Lahore', now: () => clock, logger: { error: (message) => messages.push(message) }, fetchFn: async () => { if (!available) throw new Error('network unavailable'); return weatherResponse(); } });
  await service.getConditions();
  clock += CACHE_TTL_MS + 1;
  available = false;
  const result = await service.getConditions();
  assert.equal(result.source, 'stale-cache');
  assert.equal(result.condition, 'Sunny');
  assert.match(messages[0], /Weather API request failed: network unavailable/);
});

test('uses default delivery data and logs a failure when no cached response exists', async () => {
  const messages = [];
  const service = new DeliveryWeatherService({ apiKey: 'test-key', logger: { error: (message) => messages.push(message) }, fetchFn: async () => { throw new Error('service down'); } });
  const result = await service.getConditions();
  assert.deepEqual(result, { ...DEFAULT_CONDITIONS, source: 'default' });
  assert.match(messages[0], /service down/);
});

test('the bookshop page still loads when weather data is unavailable', async () => {
  const server = createApp({ weatherService: { getConditions: async () => ({ location: 'our delivery area', condition: 'Delivery conditions are unavailable', temperatureC: null, source: 'default' }) } });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Delivery conditions are unavailable/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
