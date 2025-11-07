const { ipcRenderer, contextBridge, webUtils } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
  invoke: (channel, ...args) => {
    console.log('[Preload] invoke called, channel:', channel, 'args:', args);
    return ipcRenderer.invoke(channel, ...args);
  },
  on: (channel, handler) => {
    console.log('[Preload] Setting up listener for channel:', channel);
    // Deliberately strip event as it includes `sender`
    const subscription = (event, ...args) => {
      console.log('[Preload] Event received on channel:', channel);
      console.log('[Preload] Args count:', args.length);
      console.log('[Preload] Args:', JSON.stringify(args, null, 2));

      try {
        console.log('[Preload] About to call handler, handler type:', typeof handler);
        console.log('[Preload] Handler is function:', typeof handler === 'function');
        handler(...args);
        console.log('[Preload] Handler executed successfully');
      } catch (error) {
        console.error('[Preload] ERROR in handler for channel:', channel);
        console.error('[Preload] Error:', error);
        console.error('[Preload] Error message:', error.message);
        console.error('[Preload] Error stack:', error.stack);
        throw error; // Re-throw to see it in console
      }
    };
    ipcRenderer.on(channel, subscription);

    return () => {
      console.log('[Preload] Cleaning up listener for channel:', channel);
      ipcRenderer.off(channel, subscription); // Fixed: use off() instead of removeListener()
    };
  },
  getFilePath(file) {
    const path = webUtils.getPathForFile(file);
    return path;
  }
});
