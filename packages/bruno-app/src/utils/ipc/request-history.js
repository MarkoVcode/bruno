/**
 * IPC utilities for request history
 */

const ipcRenderer = window.ipcRenderer;

/**
 * Add a new history entry
 * @param {Object} entry - History entry
 * @returns {Promise}
 */
export const addHistoryEntry = (entry) => {
  return ipcRenderer.invoke('renderer:add-history-entry', entry);
};

/**
 * Get history entries with pagination
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of entries
 * @param {number} options.offset - Number of entries to skip
 * @param {number} options.daysToShow - Number of days to show
 * @returns {Promise<Array>}
 */
export const getHistory = (options = {}) => {
  return ipcRenderer.invoke('renderer:get-history', options);
};

/**
 * Get all history entries
 * @returns {Promise<Array>}
 */
export const getAllHistory = () => {
  return ipcRenderer.invoke('renderer:get-all-history');
};

/**
 * Clear all history
 * @returns {Promise}
 */
export const clearHistory = () => {
  return ipcRenderer.invoke('renderer:clear-history');
};

/**
 * Cleanup old history entries
 * @param {number} daysToKeep - Number of days to keep
 * @returns {Promise}
 */
export const cleanupHistory = (daysToKeep = 30) => {
  return ipcRenderer.invoke('renderer:cleanup-history', daysToKeep);
};

/**
 * Get history statistics
 * @returns {Promise}
 */
export const getHistoryStats = () => {
  return ipcRenderer.invoke('renderer:get-history-stats');
};
