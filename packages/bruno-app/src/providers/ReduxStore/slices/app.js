import { createSlice } from '@reduxjs/toolkit';
import filter from 'lodash/filter';
import brunoClipboard from 'utils/bruno-clipboard';

const initialState = {
  isDragging: false,
  idbConnectionReady: false,
  leftSidebarWidth: 222,
  sidebarCollapsed: false,
  screenWidth: 500,
  showHomePage: false,
  showPreferences: false,
  isEnvironmentSettingsModalOpen: false,
  preferences: {
    request: {
      sslVerification: true,
      customCaCertificate: {
        enabled: false,
        filePath: null
      },
      keepDefaultCaCertificates: {
        enabled: true
      },
      timeout: 0
    },
    font: {
      codeFont: 'default'
    },
    general: {
      defaultCollectionLocation: ''
    }
  },
  generateCode: {
    mainLanguage: 'Shell',
    library: 'curl',
    shouldInterpolate: true
  },
  cookies: [],
  taskQueue: [],
  systemProxyEnvVariables: {},
  clipboard: {
    hasCopiedItems: false // Whether clipboard has Bruno data (for UI)
  },
  environmentSync: {
    // Maps collection UID to sync configuration
    // { [collectionUid]: { isMaster: boolean, masterCollectionUid: string | null, subscriberCollectionUids: string[] } }
    syncRelationships: {}
  }
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    idbConnectionReady: (state) => {
      state.idbConnectionReady = true;
    },
    refreshScreenWidth: (state) => {
      state.screenWidth = window.innerWidth;
    },
    updateLeftSidebarWidth: (state, action) => {
      state.leftSidebarWidth = action.payload.leftSidebarWidth;
    },
    updateIsDragging: (state, action) => {
      state.isDragging = action.payload.isDragging;
    },
    updateEnvironmentSettingsModalVisibility: (state, action) => {
      state.isEnvironmentSettingsModalOpen = action.payload;
    },
    showHomePage: (state) => {
      state.showHomePage = true;
    },
    hideHomePage: (state) => {
      state.showHomePage = false;
    },
    showPreferences: (state, action) => {
      state.showPreferences = action.payload;
    },
    updatePreferences: (state, action) => {
      state.preferences = action.payload;
    },
    updateCookies: (state, action) => {
      state.cookies = action.payload;
    },
    insertTaskIntoQueue: (state, action) => {
      state.taskQueue.push(action.payload);
    },
    removeTaskFromQueue: (state, action) => {
      state.taskQueue = filter(state.taskQueue, (task) => task.uid !== action.payload.taskUid);
    },
    removeAllTasksFromQueue: (state) => {
      state.taskQueue = [];
    },
    updateSystemProxyEnvVariables: (state, action) => {
      state.systemProxyEnvVariables = action.payload;
    },
    updateGenerateCode: (state, action) => {
      state.generateCode = {
        ...state.generateCode,
        ...action.payload
      };
    },
    toggleSidebarCollapse: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setClipboard: (state, action) => {
      // Update clipboard UI state
      state.clipboard.hasCopiedItems = action.payload.hasCopiedItems;
    },
    setCollectionAsMaster: (state, action) => {
      const { collectionUid, isMaster } = action.payload;
      if (!state.environmentSync.syncRelationships[collectionUid]) {
        state.environmentSync.syncRelationships[collectionUid] = {
          isMaster: false,
          masterCollectionUid: null,
          subscriberCollectionUids: []
        };
      }
      state.environmentSync.syncRelationships[collectionUid].isMaster = isMaster;
      // If disabling master, remove all subscriber relationships
      if (!isMaster) {
        const subscribers = state.environmentSync.syncRelationships[collectionUid].subscriberCollectionUids || [];
        subscribers.forEach((subscriberUid) => {
          if (state.environmentSync.syncRelationships[subscriberUid]) {
            state.environmentSync.syncRelationships[subscriberUid].masterCollectionUid = null;
          }
        });
        state.environmentSync.syncRelationships[collectionUid].subscriberCollectionUids = [];
      }
    },
    subscribeToMasterEnvironments: (state, action) => {
      const { subscriberCollectionUid, masterCollectionUid } = action.payload;

      // Initialize subscriber config if needed
      if (!state.environmentSync.syncRelationships[subscriberCollectionUid]) {
        state.environmentSync.syncRelationships[subscriberCollectionUid] = {
          isMaster: false,
          masterCollectionUid: null,
          subscriberCollectionUids: []
        };
      }

      // Remove from previous master if exists
      const prevMasterUid = state.environmentSync.syncRelationships[subscriberCollectionUid].masterCollectionUid;
      if (prevMasterUid && state.environmentSync.syncRelationships[prevMasterUid]) {
        const prevMaster = state.environmentSync.syncRelationships[prevMasterUid];
        prevMaster.subscriberCollectionUids = prevMaster.subscriberCollectionUids.filter((uid) => uid !== subscriberCollectionUid);
      }

      // Set new master
      state.environmentSync.syncRelationships[subscriberCollectionUid].masterCollectionUid = masterCollectionUid;
      state.environmentSync.syncRelationships[subscriberCollectionUid].isMaster = false;

      // Add to master's subscriber list
      if (!state.environmentSync.syncRelationships[masterCollectionUid]) {
        state.environmentSync.syncRelationships[masterCollectionUid] = {
          isMaster: true,
          masterCollectionUid: null,
          subscriberCollectionUids: []
        };
      }
      if (!state.environmentSync.syncRelationships[masterCollectionUid].subscriberCollectionUids.includes(subscriberCollectionUid)) {
        state.environmentSync.syncRelationships[masterCollectionUid].subscriberCollectionUids.push(subscriberCollectionUid);
      }
    },
    unsubscribeFromMaster: (state, action) => {
      const { subscriberCollectionUid } = action.payload;

      if (!state.environmentSync.syncRelationships[subscriberCollectionUid]) {
        return;
      }

      const masterUid = state.environmentSync.syncRelationships[subscriberCollectionUid].masterCollectionUid;

      // Remove from master's subscriber list
      if (masterUid && state.environmentSync.syncRelationships[masterUid]) {
        const master = state.environmentSync.syncRelationships[masterUid];
        master.subscriberCollectionUids = master.subscriberCollectionUids.filter((uid) => uid !== subscriberCollectionUid);
      }

      // Clear subscriber's master reference
      state.environmentSync.syncRelationships[subscriberCollectionUid].masterCollectionUid = null;
    },
    removeCollectionFromSync: (state, action) => {
      const { collectionUid } = action.payload;

      if (!state.environmentSync.syncRelationships[collectionUid]) {
        return;
      }

      const config = state.environmentSync.syncRelationships[collectionUid];

      // If it's a master, unsubscribe all subscribers
      if (config.isMaster && config.subscriberCollectionUids) {
        config.subscriberCollectionUids.forEach((subscriberUid) => {
          if (state.environmentSync.syncRelationships[subscriberUid]) {
            state.environmentSync.syncRelationships[subscriberUid].masterCollectionUid = null;
          }
        });
      }

      // If it's a subscriber, remove from master's list
      if (config.masterCollectionUid && state.environmentSync.syncRelationships[config.masterCollectionUid]) {
        const master = state.environmentSync.syncRelationships[config.masterCollectionUid];
        master.subscriberCollectionUids = master.subscriberCollectionUids.filter((uid) => uid !== collectionUid);
      }

      // Remove the collection's sync config
      delete state.environmentSync.syncRelationships[collectionUid];
    },
    loadEnvironmentSyncConfig: (state, action) => {
      // Load sync config from persisted storage
      state.environmentSync.syncRelationships = action.payload.syncRelationships || {};
    }
  }
});

export const {
  idbConnectionReady,
  refreshScreenWidth,
  updateLeftSidebarWidth,
  updateIsDragging,
  updateEnvironmentSettingsModalVisibility,
  showHomePage,
  hideHomePage,
  showPreferences,
  updatePreferences,
  updateCookies,
  insertTaskIntoQueue,
  removeTaskFromQueue,
  removeAllTasksFromQueue,
  updateSystemProxyEnvVariables,
  updateGenerateCode,
  toggleSidebarCollapse,
  setClipboard,
  setCollectionAsMaster,
  subscribeToMasterEnvironments,
  unsubscribeFromMaster,
  removeCollectionFromSync,
  loadEnvironmentSyncConfig
} = appSlice.actions;

export const savePreferences = (preferences) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;

    ipcRenderer
      .invoke('renderer:save-preferences', preferences)
      .then(() => dispatch(updatePreferences(preferences)))
      .then(resolve)
      .catch(reject);
  });
};

export const deleteCookiesForDomain = (domain) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;

    ipcRenderer.invoke('renderer:delete-cookies-for-domain', domain).then(resolve).catch(reject);
  });
};

export const deleteCookie = (domain, path, cookieKey) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;

    ipcRenderer.invoke('renderer:delete-cookie', domain, path, cookieKey).then(resolve).catch(reject);
  });
};

export const addCookie = (domain, cookie) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;

    ipcRenderer.invoke('renderer:add-cookie', domain, cookie).then(resolve).catch(reject);
  });
};

export const modifyCookie = (domain, oldCookie, cookie) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;

    ipcRenderer.invoke('renderer:modify-cookie', domain, oldCookie, cookie).then(resolve).catch(reject);
  });
};

export const getParsedCookie = (cookieStr) => () => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;
    ipcRenderer.invoke('renderer:get-parsed-cookie', cookieStr).then(resolve).catch(reject);
  });
};

export const createCookieString = (cookieObj) => () => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;
    ipcRenderer.invoke('renderer:create-cookie-string', cookieObj).then(resolve).catch(reject);
  });
};

export const completeQuitFlow = () => (dispatch, getState) => {
  const { ipcRenderer } = window;
  return ipcRenderer.invoke('main:complete-quit-flow');
};

export const copyRequest = (item) => (dispatch, getState) => {
  brunoClipboard.write(item);
  dispatch(setClipboard({ hasCopiedItems: true }));
  return Promise.resolve();
};

export const saveEnvironmentSyncConfig = () => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;
    const state = getState();
    const syncConfig = {
      syncRelationships: state.app.environmentSync.syncRelationships
    };

    ipcRenderer
      .invoke('renderer:save-environment-sync-config', syncConfig)
      .then(resolve)
      .catch(reject);
  });
};

export const loadEnvironmentSyncConfigFromStorage = () => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;

    ipcRenderer
      .invoke('renderer:get-environment-sync-config')
      .then((syncConfig) => {
        if (syncConfig) {
          dispatch(loadEnvironmentSyncConfig(syncConfig));
        }
        resolve(syncConfig);
      })
      .catch(reject);
  });
};

export default appSlice.reducer;
