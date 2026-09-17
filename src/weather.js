const CACHE_TTL_MS = 15 * 60 * 1000;

const DEFAULT_CONDITIONS = {
  location: 'our delivery area',
  condition: 'Delivery conditions are unavailable',
  temperatureC: null
};

function defaultConditions() {
  return {
    ...DEFAULT_CONDITIONS,
    source: 'default'
  };
}

class DeliveryWeatherService {
  constructor({
    apiKey,
    location,
    fetchFn = fetch,
    logger = console,
    now = () => Date.now(),
    ttlMs = CACHE_TTL_MS
  } = {}) {
    this.apiKey = apiKey;
    this.location = location;
    this.fetchFn = fetchFn;
    this.logger = logger;
    this.now = now;
    this.ttlMs = ttlMs;

    this.cache = null;
    this.pendingPromise = null;
  }

  async getConditions() {
    const time = this.now();

    // Return valid cached data when available.
    if (this.cache && time < this.cache.expiresAt) {
      return {
        ...this.cache.value,
        source: 'cache'
      };
    }

    // Prevent multiple simultaneous API requests.
    if (this.pendingPromise) {
      return this.pendingPromise;
    }

    this.pendingPromise = this._fetchConditions(time).finally(() => {
      this.pendingPromise = null;
    });

    return this.pendingPromise;
  }

  async _fetchConditions(time) {
    try {
      if (!this.apiKey) {
        throw new Error('WEATHER_API_KEY is not configured');
      }

      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 3000);

      try {
        const url = new URL(
          'https://api.weatherapi.com/v1/current.json'
        );

        url.searchParams.set('key', this.apiKey);
        url.searchParams.set('q', this.location);

        let response;

        try {
          response = await this.fetchFn(url.toString(), {
            signal: controller.signal
          });
        } catch (error) {
          if (error.name === 'AbortError') {
            throw new Error(
              'Weather API request timed out after 3000ms'
            );
          }

          throw error;
        }

        if (!response.ok) {
          throw new Error(
            `Weather API responded with ${response.status}`
          );
        }

        const data = await response.json();

        const value = {
          location: data.location?.name || this.location,
          condition:
            data.current?.condition?.text ||
            'Current conditions available',
          temperatureC: Number.isFinite(data.current?.temp_c)
            ? data.current.temp_c
            : null
        };

        // Cache only successful API responses.
        this.cache = {
          value,
          expiresAt: time + this.ttlMs
        };

        return {
          ...value,
          source: 'live'
        };
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      this.logger.error(
        `Weather API request failed: ${error.message}`
      );

      // If live data fails but old cached data exists,
      // return the stale cache instead of returning nothing.
      if (this.cache) {
        return {
          ...this.cache.value,
          source: 'stale-cache'
        };
      }

      // If there is no cache, return safe default data.
      // Failed requests are not cached so future requests
      // can retry the API immediately.
      return defaultConditions();
    }
  }
}

module.exports = {
  CACHE_TTL_MS,
  DEFAULT_CONDITIONS,
  DeliveryWeatherService
};