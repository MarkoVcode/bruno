const { ipcMain } = require('electron');
const { requestHistoryStore } = require('../store/request-history');

/**
 * Register IPC handlers for request history operations
 */
const registerRequestHistoryIpc = (mainWindow) => {
  /**
   * Add a new history entry
   */
  ipcMain.handle('renderer:add-history-entry', async (event, entry) => {
    try {
      requestHistoryStore.addEntry(entry);
      return { success: true };
    } catch (error) {
      console.error('Error adding history entry:', error);
      return Promise.reject(error);
    }
  });

  /**
   * Get history entries with pagination
   */
  ipcMain.handle('renderer:get-history', async (event, options = {}) => {
    try {
      const history = requestHistoryStore.getHistory(options);
      return history;
    } catch (error) {
      console.error('Error getting history:', error);
      return Promise.reject(error);
    }
  });

  /**
   * Get all history entries
   */
  ipcMain.handle('renderer:get-all-history', async (event) => {
    try {
      const history = requestHistoryStore.getAllHistory();
      return history;
    } catch (error) {
      console.error('Error getting all history:', error);
      return Promise.reject(error);
    }
  });

  /**
   * Clear all history
   */
  ipcMain.handle('renderer:clear-history', async (event) => {
    try {
      requestHistoryStore.clearHistory();
      return { success: true };
    } catch (error) {
      console.error('Error clearing history:', error);
      return Promise.reject(error);
    }
  });

  /**
   * Cleanup old history entries
   */
  ipcMain.handle('renderer:cleanup-history', async (event, daysToKeep = 30) => {
    try {
      const result = requestHistoryStore.cleanup(daysToKeep);
      return result;
    } catch (error) {
      console.error('Error cleaning up history:', error);
      return Promise.reject(error);
    }
  });

  /**
   * Get history statistics
   */
  ipcMain.handle('renderer:get-history-stats', async (event) => {
    try {
      const stats = requestHistoryStore.getStats();
      return stats;
    } catch (error) {
      console.error('Error getting history stats:', error);
      return Promise.reject(error);
    }
  });
};

module.exports = registerRequestHistoryIpc;
