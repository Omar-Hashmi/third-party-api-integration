# Papertrail Books — Third-Party API Integration

This project is a small bookshop web application that demonstrates how to integrate a third-party API into an existing application. I integrated WeatherAPI's current-weather endpoint so the Papertrail Books home page can display current local weather information and use it to set delivery expectations for customers.

The main focus of the project was not just making an API request, but handling the API integration reliably. The application keeps the API key in an environment variable instead of hard-coding it, caches successful weather responses for 15 minutes, and continues to provide a usable page when the external weather service is unavailable.

## What I Built

The application includes:

* Integration with WeatherAPI's current-weather endpoint.
* Server-side handling of the external API request.
* Environment-variable based API key configuration.
* 15-minute in-memory caching of successful weather responses.
* Fallback to the most recently cached weather response when the API fails.
* A safe default delivery message when no successful API response has been received.
* Server-side error logging without exposing the API key.
* Automated checks using Node's built-in test runner.

The caching was added to avoid making an external API request on every page load. This reduces unnecessary requests and also makes the application more resilient to temporary failures from the third-party service.

## What Was Difficult

The most difficult part was handling the fact that the application depends on a service that I do not control. A successful API request is not guaranteed, so simply fetching the weather and displaying it would leave the application vulnerable to a poor user experience whenever the third-party service was unavailable.

I therefore had to think about several different states: a successful API response, a previously cached response, an API failure with cached data available, and an API failure where no cached data exists. Designing these fallback cases helped me understand that third-party API integration is not only about sending requests, but also about handling failures gracefully.

Another important part was keeping the API credential separate from the source code. The application reads the WeatherAPI key from the environment, while `.env` is excluded from Git. This prevents the real credential from being committed to the repository.

## What I Left Out

This is intentionally a small demonstration project rather than a production-ready e-commerce platform. I focused on the third-party API integration and its reliability instead of implementing features such as real customer accounts, payments, order processing, persistent weather storage, or a full book inventory system.

The weather data is also cached only in application memory. This means the cache is cleared whenever the server restarts. A production application with multiple server instances could use a shared cache such as Redis instead.

I also did not implement advanced weather functionality such as forecasts, historical weather, multiple weather providers, or automatic retry/backoff strategies. These were outside the scope of the task.

## Resilience and Caching

Weather responses are cached for 15 minutes using an in-memory cache.

The application follows this general flow:

1. Check whether a valid cached weather response exists.
2. If the cache is valid, use the cached response instead of calling WeatherAPI.
3. If the cache has expired, request fresh weather data.
4. If the request succeeds, update the cache.
5. If the request fails but an older cached response exists, use that response.
6. If no cached response has ever been available, display a safe default delivery message.

This allows the main page to remain usable even when the external API temporarily fails.

## Security

The WeatherAPI key is stored in an environment variable:

```text
WEATHER_API_KEY
```

The `.env` file is ignored by Git, so the real API key is not committed to the repository.

The application also avoids logging the API key or rendering it in the browser.

## Setup and Run

1. Create a WeatherAPI account and obtain an API key.

2. Copy `.env.example` to `.env`.

3. Add your API key:

```env
WEATHER_API_KEY=your_api_key_here
```

4. Start the application:

```bash
node src/server.js
```

5. Open:

```text
http://localhost:3000
```

No dependency installation is required for the current implementation.

## Testing

Run the automated checks with:

```bash
node --test
```

The tests verify the application's API integration and fallback behavior.

## Technologies Used

* Node.js
* JavaScript
* WeatherAPI
* HTML/CSS
* Node.js built-in test runner
* Environment variables
* In-memory caching
