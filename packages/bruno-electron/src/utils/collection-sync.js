const fs = require('fs');
const path = require('path');
const { safeParseJSON } = require('./common');
const { isReadOnlyCollection } = require('./readonly-detection');
const { fetchOpenapiFromUrl } = require('./openapi-url-fetcher');
const { importCollection } = require('./collection-import');
const fsExtra = require('fs-extra');

/**
 * Synchronize a collection from its remote OpenAPI source URL
 * @param {string} collectionPath - Path to the collection directory
 * @param {Object} mainWindow - Electron main window
 * @param {Object} lastOpenedCollections - Collection history manager
 * @param {Object} watcher - Collection watcher instance
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function syncCollectionFromUrl(collectionPath, mainWindow, lastOpenedCollections, watcher) {
  // Read bruno.json to get the OpenAPI source URL
  const brunoJsonPath = path.join(collectionPath, 'bruno.json');

  if (!fs.existsSync(brunoJsonPath)) {
    throw new Error('Collection configuration (bruno.json) not found');
  }

  const brunoJsonContent = fs.readFileSync(brunoJsonPath, 'utf8');
  const brunoConfig = safeParseJSON(brunoJsonContent);

  if (!brunoConfig) {
    throw new Error('Failed to parse collection configuration');
  }

  // Check if collection has a remote source URL
  if (!brunoConfig.openapiSource || !brunoConfig.openapiSource.url) {
    throw new Error('Collection does not have a remote OpenAPI source URL');
  }

  // Verify collection is read-only
  if (!isReadOnlyCollection(collectionPath, brunoConfig.name)) {
    throw new Error('Collection must be read-only to sync from remote source');
  }

  const sourceUrl = brunoConfig.openapiSource.url;

  // Fetch the latest OpenAPI spec from the URL
  const { spec, format } = await fetchOpenapiFromUrl(sourceUrl);

  // Parse the spec to get collection name
  const newCollectionName = spec.info?.title || brunoConfig.name;

  // Check if collection name matches (for read-only validation)
  if (newCollectionName !== brunoConfig.name) {
    throw new Error(`OpenAPI spec title "${newCollectionName}" does not match collection name "${brunoConfig.name}". Cannot sync.`);
  }

  // Get parent directory and collection folder name
  const collectionLocation = path.dirname(collectionPath);
  const collectionFolderName = path.basename(collectionPath);

  // Re-import the collection using the utility function
  // We need to convert the OpenAPI spec to Bruno format first
  const brunoConverters = require('@usebruno/converters');
  const { openApiToBruno } = brunoConverters;

  // Use the same grouping type as before (default to 'tags')
  const collection = openApiToBruno(spec, { groupBy: 'tags' });

  // Store the UID before deletion
  const { generateUidBasedOnHash } = require('./common');
  const originalUid = generateUidBasedOnHash(collectionPath);

  // Remove the watcher before deleting the collection directory
  // This prevents the watcher from detecting file changes during the sync process
  if (watcher && watcher.hasWatcher(collectionPath)) {
    watcher.removeWatcher(collectionPath, mainWindow, originalUid);
  }

  // Delete the entire collection directory
  await fsExtra.remove(collectionPath);

  // Import the collection with the same folder name
  // This will recreate all files in the collection directory
  const { uid, brunoConfig: updatedBrunoConfig } = await importCollection(collection, collectionLocation, mainWindow, lastOpenedCollections, collectionFolderName, spec, format, sourceUrl);

  // The importCollection function sends main:collection-opened event
  // However, since the collection is already open in the UI, we need to reload it
  // Send a collection reload event to refresh the UI with the new data
  mainWindow.webContents.send('main:collection-reloaded', collectionPath, uid, updatedBrunoConfig);

  return {
    success: true,
    message: `Collection successfully synced from ${sourceUrl}`,
    collectionPath: path.join(collectionLocation, collectionFolderName),
    uid
  };
}

module.exports = {
  syncCollectionFromUrl
};
