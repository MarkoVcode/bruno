const Store = require('electron-store');

/**
 * The environment sync relationships are stored in the electron store 'environment-sync.json'.
 * This persists which collections are masters and which subscribe to masters.
 */

class EnvironmentSyncStore {
  constructor() {
    this.store = new Store({
      name: 'environment-sync',
      clearInvalidConfig: true
    });
  }

  getSyncConfig() {
    return this.store.get('syncRelationships', {});
  }

  saveSyncConfig(syncRelationships) {
    return this.store.set('syncRelationships', syncRelationships);
  }

  clearSyncConfig() {
    return this.store.delete('syncRelationships');
  }
}

const environmentSyncStore = new EnvironmentSyncStore();

const getSyncConfig = () => {
  return environmentSyncStore.getSyncConfig();
};

const saveSyncConfig = (syncRelationships) => {
  return environmentSyncStore.saveSyncConfig(syncRelationships);
};

const clearSyncConfig = () => {
  return environmentSyncStore.clearSyncConfig();
};

module.exports = {
  getSyncConfig,
  saveSyncConfig,
  clearSyncConfig,
  environmentSyncStore
};
