# Papertrail Books — third-party API integration

This bookshop home page shows current local weather to set delivery expectations. It uses [WeatherAPI's current-weather endpoint](https://www.weatherapi.com/docs/).

## Setup and run

1. Create a free WeatherAPI key.
2. Copy `.env.example` to `.env` and set `WEATHER_API_KEY`. `.env` is ignored by Git, so the key is never committed.
3. Run the app:

```powershell
node src/server.js
```

Open `http://localhost:3000`. No dependency installation is required.

## Resilience and caching

- Weather responses are cached in memory for **15 minutes** (`CACHE_TTL_MS = 900000`). Page loads inside that lifetime do not call the API.
- Once the cache expires, the app refreshes the data. If that call fails, it serves the most recently cached response instead.
- If no successful response was ever available, the page still loads with a safe default delivery message.
- Failed calls are logged on the server with `console.error`; API keys are never logged or rendered.

Run checks with:

```powershell
node --test
```
