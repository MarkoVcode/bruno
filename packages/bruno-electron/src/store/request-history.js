const Store = require('electron-store');

/**
 * Request History Store
 * Stores the history of all executed HTTP requests
 * Data is persisted in 'request-history.json' in electron store
 */

class RequestHistoryStore {
  constructor() {
    this.store = new Store({
      name: 'request-history',
      clearInvalidConfig: true
    });
  }

  /**
   * Add a new history entry
   * @param {Object} entry - History entry object
   * @param {number} entry.timestamp - Timestamp in milliseconds
   * @param {string} entry.collectionName - Name of the collection
   * @param {string} entry.collectionUid - UID of the collection
   * @param {string} entry.resourceName - Name of the request/resource
   * @param {string} entry.itemUid - UID of the request item
   * @param {string} entry.method - HTTP method (GET, POST, etc.)
   * @param {string} entry.configuredUrl - URL as configured (with variables)
   * @param {string} entry.actualUrl - Actual executed URL (interpolated)
   * @param {number} entry.status - HTTP status code
   * @param {string} entry.statusText - HTTP status text
   * @param {number} entry.duration - Request duration in milliseconds
   */
  addEntry(entry) {
    const history = this.store.get('history', []);

    // Add new entry at the beginning (most recent first)
    history.unshift({
      timestamp: entry.timestamp || Date.now(),
      collectionName: entry.collectionName,
      collectionUid: entry.collectionUid,
      resourceName: entry.resourceName,
      itemUid: entry.itemUid,
      method: entry.method,
      configuredUrl: entry.configuredUrl,
      actualUrl: entry.actualUrl,
      status: entry.status,
      statusText: entry.statusText,
      duration: entry.duration
    });

    // Keep only the most recent entries to prevent unbounded growth
    // Store maximum 5000 entries (roughly 5 days at 1000 requests/day)
    const maxEntries = 5000;
    if (history.length > maxEntries) {
      history.splice(maxEntries);
    }

    this.store.set('history', history);
  }

  /**
   * Get history entries
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of entries to return
   * @param {number} options.offset - Number of entries to skip
   * @param {number} options.daysToShow - Number of days to show (default: 5)
   * @returns {Array} Array of history entries
   */
  getHistory(options = {}) {
    const { limit = 1000, offset = 0, daysToShow = 5 } = options;
    const history = this.store.get('history', []);

    // Filter by date range if daysToShow is specified
    const cutoffDate = Date.now() - (daysToShow * 24 * 60 * 60 * 1000);
    const filteredHistory = history.filter((entry) => entry.timestamp >= cutoffDate);

    // Apply pagination
    return filteredHistory.slice(offset, offset + limit);
  }

  /**
   * Get all history entries (without filtering)
   * @returns {Array} All history entries
   */
  getAllHistory() {
    return this.store.get('history', []);
  }

  /**
   * Clear all history
   */
  clearHistory() {
    this.store.set('history', []);
  }

  /**
   * Cleanup old entries
   * Removes entries older than the specified number of days
   * @param {number} daysToKeep - Number of days to keep (default: 30)
   */
  cleanup(daysToKeep = 30) {
    const history = this.store.get('history', []);
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    const filteredHistory = history.filter((entry) => entry.timestamp >= cutoffDate);

    this.store.set('history', filteredHistory);

    return {
      removed: history.length - filteredHistory.length,
      remaining: filteredHistory.length
    };
  }

  /**
   * Get statistics about the history
   * @returns {Object} Statistics object
   */
  getStats() {
    const history = this.store.get('history', []);

    return {
      totalEntries: history.length,
      oldestEntry: history.length > 0 ? history[history.length - 1].timestamp : null,
      newestEntry: history.length > 0 ? history[0].timestamp : null
    };
  }
}

// Export singleton instance
const requestHistoryStore = new RequestHistoryStore();

module.exports = {
  requestHistoryStore,
  RequestHistoryStore
};
