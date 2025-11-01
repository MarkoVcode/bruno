import { findCollectionByUid } from './collections';
import cloneDeep from 'lodash/cloneDeep';

/**
 * Get sync configuration for a collection
 * @param {object} syncRelationships - The environment sync relationships from Redux state
 * @param {string} collectionUid - The collection UID
 * @returns {object|null} Sync configuration or null if not configured
 */
export const getCollectionSyncConfig = (syncRelationships, collectionUid) => {
  return syncRelationships[collectionUid] || null;
};

/**
 * Check if a collection is a master (shares environments with others)
 * @param {object} syncRelationships - The environment sync relationships from Redux state
 * @param {string} collectionUid - The collection UID
 * @returns {boolean}
 */
export const isCollectionMaster = (syncRelationships, collectionUid) => {
  const config = getCollectionSyncConfig(syncRelationships, collectionUid);
  return config ? config.isMaster === true : false;
};

/**
 * Check if a collection is a subscriber (uses shared environments from master)
 * @param {object} syncRelationships - The environment sync relationships from Redux state
 * @param {string} collectionUid - The collection UID
 * @returns {boolean}
 */
export const isCollectionSubscriber = (syncRelationships, collectionUid) => {
  const config = getCollectionSyncConfig(syncRelationships, collectionUid);
  return config ? config.masterCollectionUid !== null : false;
};

/**
 * Get the master collection UID for a subscriber
 * @param {object} syncRelationships - The environment sync relationships from Redux state
 * @param {string} subscriberCollectionUid - The subscriber collection UID
 * @returns {string|null} Master collection UID or null
 */
export const getMasterCollectionUid = (syncRelationships, subscriberCollectionUid) => {
  const config = getCollectionSyncConfig(syncRelationships, subscriberCollectionUid);
  return config ? config.masterCollectionUid : null;
};

/**
 * Get all subscriber collection UIDs for a master
 * @param {object} syncRelationships - The environment sync relationships from Redux state
 * @param {string} masterCollectionUid - The master collection UID
 * @returns {string[]} Array of subscriber collection UIDs
 */
export const getSubscriberCollectionUids = (syncRelationships, masterCollectionUid) => {
  const config = getCollectionSyncConfig(syncRelationships, masterCollectionUid);
  return config ? config.subscriberCollectionUids || [] : [];
};

/**
 * Get all master collections (collections that share environments)
 * @param {object} syncRelationships - The environment sync relationships from Redux state
 * @returns {string[]} Array of master collection UIDs
 */
export const getMasterCollectionUids = (syncRelationships) => {
  return Object.keys(syncRelationships).filter((uid) => syncRelationships[uid].isMaster === true);
};

/**
 * Get master collections suitable for subscription (excludes the given collection and its descendants)
 * Prevents circular dependencies
 * @param {object} syncRelationships - The environment sync relationships from Redux state
 * @param {string} excludeCollectionUid - Collection UID to exclude from results
 * @returns {string[]} Array of available master collection UIDs
 */
export const getAvailableMasterCollections = (syncRelationships, excludeCollectionUid) => {
  const masterUids = getMasterCollectionUids(syncRelationships);

  // Filter out the collection itself and any collections that subscribe to it
  return masterUids.filter((masterUid) => {
    if (masterUid === excludeCollectionUid) {
      return false;
    }

    // Check if the master is actually a subscriber to the excluded collection
    // This prevents circular dependencies
    const masterConfig = getCollectionSyncConfig(syncRelationships, masterUid);
    if (masterConfig && masterConfig.masterCollectionUid === excludeCollectionUid) {
      return false;
    }

    return true;
  });
};

/**
 * Copy all environments from master collection to subscriber collection
 * @param {object} masterCollection - Master collection object
 * @param {object} subscriberCollection - Subscriber collection object
 * @returns {array} Cloned environments from master
 */
export const copyEnvironmentsFromMaster = (masterCollection, subscriberCollection) => {
  if (!masterCollection || !masterCollection.environments) {
    return [];
  }

  // Deep clone to avoid reference issues
  return cloneDeep(masterCollection.environments);
};

/**
 * Validate that a subscription wouldn't create a circular dependency
 * @param {object} syncRelationships - The environment sync relationships from Redux state
 * @param {string} subscriberUid - Collection that wants to subscribe
 * @param {string} masterUid - Collection to subscribe to
 * @returns {boolean} True if valid, false if would create circular dependency
 */
export const validateSubscription = (syncRelationships, subscriberUid, masterUid) => {
  // Can't subscribe to yourself
  if (subscriberUid === masterUid) {
    return false;
  }

  // Check if master is already a subscriber to the would-be subscriber
  // This would create a circular dependency
  const masterConfig = getCollectionSyncConfig(syncRelationships, masterUid);
  if (masterConfig && masterConfig.masterCollectionUid === subscriberUid) {
    return false;
  }

  // Check if any of the master's dependencies include the subscriber
  // (deeper circular dependency check)
  let currentMaster = masterUid;
  const visited = new Set();

  while (currentMaster) {
    if (visited.has(currentMaster)) {
      // Circular dependency detected
      return false;
    }

    visited.add(currentMaster);

    const config = getCollectionSyncConfig(syncRelationships, currentMaster);
    if (!config) {
      break;
    }

    if (config.masterCollectionUid === subscriberUid) {
      // Circular dependency: master chain leads back to subscriber
      return false;
    }

    currentMaster = config.masterCollectionUid;
  }

  return true;
};

/**
 * Group collections by sync relationships for sidebar rendering
 * @param {array} collections - All collections from Redux state
 * @param {object} syncRelationships - The environment sync relationships from Redux state
 * @returns {array} Grouped collections with grouping metadata
 */
export const groupCollectionsBySyncRelationship = (collections, syncRelationships) => {
  const result = [];
  const processedSubscribers = new Set();

  // First pass: add all collections that are NOT subscribers (masters and standalone)
  collections.forEach((collection) => {
    const config = getCollectionSyncConfig(syncRelationships, collection.uid);

    if (!config || !config.masterCollectionUid) {
      // This is either a master or standalone collection
      result.push({
        ...collection,
        _isMaster: config ? config.isMaster : false,
        _isSubscriber: false,
        _masterCollectionUid: null
      });

      // Add its subscribers immediately after (indented)
      if (config && config.isMaster && config.subscriberCollectionUids) {
        config.subscriberCollectionUids.forEach((subscriberUid) => {
          const subscriberCollection = collections.find((c) => c.uid === subscriberUid);
          if (subscriberCollection) {
            result.push({
              ...subscriberCollection,
              _isMaster: false,
              _isSubscriber: true,
              _masterCollectionUid: collection.uid,
              _indented: true // Visual indicator for rendering
            });
            processedSubscribers.add(subscriberUid);
          }
        });
      }
    }
  });

  // Second pass: add any subscribers that weren't processed (orphaned subscribers)
  collections.forEach((collection) => {
    if (!processedSubscribers.has(collection.uid)) {
      const config = getCollectionSyncConfig(syncRelationships, collection.uid);
      if (config && config.masterCollectionUid) {
        // This is an orphaned subscriber (master not in current collections list)
        result.push({
          ...collection,
          _isMaster: false,
          _isSubscriber: true,
          _masterCollectionUid: config.masterCollectionUid,
          _indented: false // No indent since master isn't visible
        });
      }
    }
  });

  return result;
};
