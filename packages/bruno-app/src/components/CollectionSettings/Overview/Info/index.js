import React from "react";
import { getTotalRequestCountInCollection } from 'utils/collections/';
import { IconFolder, IconWorld, IconApi, IconShare, IconFileCode, IconRefresh } from '@tabler/icons';
import { areItemsLoading, getItemsLoadStats } from "utils/collections/index";
import { useState, useEffect } from 'react';
import ShareCollection from "components/ShareCollection/index";
import { useDispatch, useSelector } from 'react-redux';
import { updateSettingsSelectedTab } from 'providers/ReduxStore/slices/collections';
import {
  toggleCollectionAsMaster,
  subscribeCollectionToMaster,
  unsubscribeCollectionFromMaster
} from 'providers/ReduxStore/slices/collections/actions';
import {
  isCollectionMaster,
  isCollectionSubscriber,
  getMasterCollectionUid,
  getSubscriberCollectionUids,
  getAvailableMasterCollections
} from 'utils/environment-sync';
import { findCollectionByUid } from 'utils/collections';
import toast from 'react-hot-toast';

const Info = ({ collection }) => {
  const dispatch = useDispatch();
  const totalRequestsInCollection = getTotalRequestCountInCollection(collection);

  const isCollectionLoading = areItemsLoading(collection);
  const { loading: itemsLoadingCount, total: totalItems } = getItemsLoadStats(collection);
  const [showShareCollectionModal, toggleShowShareCollectionModal] = useState(false);
  const [hasOpenApi, setHasOpenApi] = useState(false);
  const [remoteSource, setRemoteSource] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Environment sync state
  const syncRelationships = useSelector((state) => state.app.environmentSync.syncRelationships);
  const collections = useSelector((state) => state.collections.collections);
  const isMaster = isCollectionMaster(syncRelationships, collection.uid);
  const isSubscriber = isCollectionSubscriber(syncRelationships, collection.uid);
  const masterCollectionUid = getMasterCollectionUid(syncRelationships, collection.uid);
  const subscriberUids = getSubscriberCollectionUids(syncRelationships, collection.uid);
  const availableMasters = getAvailableMasterCollections(syncRelationships, collection.uid);

  useEffect(() => {
    const checkOpenApi = async () => {
      try {
        const { ipcRenderer } = window;
        const exists = await ipcRenderer.invoke('renderer:has-openapi-spec', collection.pathname);
        setHasOpenApi(exists);
      } catch (error) {
        console.error('Error checking for OpenAPI spec:', error);
        setHasOpenApi(false);
      }
    };

    checkOpenApi();

    // Check for remote source metadata
    if (collection.brunoConfig?.openapiSource) {
      setRemoteSource(collection.brunoConfig.openapiSource);
    } else {
      setRemoteSource(null);
    }
  }, [collection.pathname, collection.brunoConfig]);

  const handleToggleShowShareCollectionModal = (value) => (e) => {
    toggleShowShareCollectionModal(value);
  };

  const handleOpenApiDocClick = () => {
    dispatch(updateSettingsSelectedTab({
      collectionUid: collection.uid,
      tab: 'apidoc'
    }));
  };

  const handleToggleMaster = async (e) => {
    const checked = e.target.checked;
    try {
      await dispatch(toggleCollectionAsMaster(collection.uid, checked));
      toast.success(checked ? 'Environment sharing enabled' : 'Environment sharing disabled');
    } catch (error) {
      toast.error('Failed to update environment sharing');
      console.error('Error toggling master:', error);
    }
  };

  const handleSubscriberChange = async (e) => {
    const selectedMasterUid = e.target.value;

    try {
      if (selectedMasterUid === '') {
        // Unsubscribe
        await dispatch(unsubscribeCollectionFromMaster(collection.uid));
        toast.success('Unsubscribed from master environment');
      } else {
        // Subscribe to new master
        await dispatch(subscribeCollectionToMaster(collection.uid, selectedMasterUid));
        const masterCollection = findCollectionByUid(collections, selectedMasterUid);
        toast.success(`Subscribed to ${masterCollection?.name || 'master'} environments`);
      }
    } catch (error) {
      toast.error('Failed to update environment subscription');
      console.error('Error updating subscription:', error);
    }
  };

  const handleSyncFromRemote = async () => {
    if (!remoteSource?.url) return;

    // Check if collection is read-only
    const isReadOnly = collection.brunoConfig?.readOnly || collection.readOnly;
    if (!isReadOnly) {
      toast.error('Collection must be read-only to sync from remote source');
      return;
    }

    setIsSyncing(true);
    try {
      const { ipcRenderer } = window;
      const result = await ipcRenderer.invoke('renderer:sync-openapi-collection', collection.pathname);

      if (result.success) {
        toast.success('Collection synced successfully from remote source');
      }
    } catch (error) {
      console.error('Error syncing collection:', error);
      toast.error(error.message || 'Failed to sync collection from remote source');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-fit">
      <div className="rounded-lg py-6">
        <div className="grid gap-6">
          {/* Location Row */}
          <div className="flex items-start">
            <div className="flex-shrink-0 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <IconFolder className="w-5 h-5 text-blue-500" stroke={1.5} />
            </div>
            <div className="ml-4">
              <div className="font-semibold text-sm">Location</div>
              <div className="mt-1 text-sm text-muted break-all">
                {collection.pathname}
              </div>
            </div>
          </div>

          {/* Environments Row */}
          <div className="flex items-start">
            <div className="flex-shrink-0 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <IconWorld className="w-5 h-5 text-green-500" stroke={1.5} />
            </div>
            <div className="ml-4">
              <div className="font-semibold text-sm">Environments</div>
              <div className="mt-1 text-sm text-muted">
                {collection.environments?.length || 0} environment{collection.environments?.length !== 1 ? 's' : ''} configured
              </div>
            </div>
          </div>

          {/* Requests Row */}
          <div className="flex items-start">
            <div className="flex-shrink-0 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <IconApi className="w-5 h-5 text-purple-500" stroke={1.5} />
            </div>
            <div className="ml-4">
              <div className="font-semibold text-sm">Requests</div>
              <div className="mt-1 text-sm text-muted">
                {
                  isCollectionLoading? `${totalItems - itemsLoadingCount} out of ${totalItems} requests in the collection loaded` : `${totalRequestsInCollection} request${totalRequestsInCollection !== 1 ? 's' : ''} in collection`
                }
              </div>
            </div>
          </div>

          {/* OpenAPI Row - Show if collection has OpenAPI spec */}
          {hasOpenApi && (
            <div className="flex items-start group cursor-pointer" onClick={handleOpenApiDocClick}>
              <div className="flex-shrink-0 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <IconFileCode className="w-5 h-5 text-amber-500" stroke={1.5} />
              </div>
              <div className="ml-4 h-full flex flex-col justify-start">
                <div className="font-semibold text-sm h-fit my-auto">OpenAPI</div>
                <div className="mt-1 text-sm group-hover:underline text-link">
                  View API Documentation
                </div>
              </div>
            </div>
          )}

          {/* Remote Source Row - Show if collection was imported from URL */}
          {remoteSource && remoteSource.url && (
            <div className="flex items-start">
              <div className="flex-shrink-0 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                <IconWorld className="w-5 h-5 text-cyan-500" stroke={1.5} />
              </div>
              <div className="ml-4 flex-1">
                <div className="font-semibold text-sm">Remote Source</div>
                <div className="mt-1 text-sm text-muted break-all" title={remoteSource.url}>
                  {remoteSource.url}
                </div>
                {remoteSource.lastSynced && (
                  <div className="mt-1 text-xs text-muted">
                    Last synced: {new Date(remoteSource.lastSynced).toLocaleString()}
                  </div>
                )}
                <button
                  onClick={handleSyncFromRemote}
                  disabled={!(collection.brunoConfig?.readOnly || collection.readOnly) || isSyncing}
                  className={`mt-3 px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                    (collection.brunoConfig?.readOnly || collection.readOnly) && !isSyncing
                      ? 'bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                  title={
                    !(collection.brunoConfig?.readOnly || collection.readOnly)
                      ? 'Collection must be read-only to sync from remote source'
                      : isSyncing
                        ? 'Syncing...'
                        : 'Refresh collection from remote source'
                  }
                >
                  <IconRefresh className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} stroke={1.5} />
                  {isSyncing ? 'Syncing...' : 'Refresh'}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-start group cursor-pointer" onClick={handleToggleShowShareCollectionModal(true)}>
            <div className="flex-shrink-0 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <IconShare className="w-5 h-5 text-indigo-500" stroke={1.5} />
            </div>
            <div className="ml-4 h-full flex flex-col justify-start">
              <div className="font-semibold text-sm h-fit my-auto">Export</div>
              <div className="mt-1 text-sm group-hover:underline text-link">
                Export Collection
              </div>
            </div>
          </div>

          {/* Environment Sharing Section */}
          <div className="flex items-start">
            <div className="flex-shrink-0 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
              <IconRefresh className="w-5 h-5 text-teal-500" stroke={1.5} />
            </div>
            <div className="ml-4 flex-1">
              <div className="font-semibold text-sm mb-3">Environment Sharing</div>

              {/* Master checkbox */}
              <div className="mb-3">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isMaster}
                    onChange={handleToggleMaster}
                    disabled={isSubscriber}
                    className="mr-2 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className={`text-sm ${isSubscriber ? 'text-muted' : ''}`}>
                    Share environments with other collections
                  </span>
                </label>
                {isMaster && subscriberUids.length > 0 && (
                  <div className="mt-1 ml-6 text-xs text-muted">
                    {subscriberUids.length} collection{subscriberUids.length !== 1 ? 's' : ''} subscribed
                  </div>
                )}
              </div>

              {/* Subscriber dropdown */}
              <div>
                <label className="block text-sm text-muted mb-1">
                  Use shared environment from:
                </label>
                <select
                  value={masterCollectionUid || ''}
                  onChange={handleSubscriberChange}
                  disabled={isMaster || availableMasters.length === 0}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="">None (use own environments)</option>
                  {availableMasters.map((masterUid) => {
                    const masterCollection = findCollectionByUid(collections, masterUid);
                    return masterCollection ? (
                      <option key={masterUid} value={masterUid}>
                        {masterCollection.name}
                      </option>
                    ) : null;
                  })}
                </select>
                {isMaster && (
                  <div className="mt-1 text-xs text-muted">
                    Cannot subscribe while sharing environments
                  </div>
                )}
                {!isMaster && availableMasters.length === 0 && (
                  <div className="mt-1 text-xs text-muted">
                    No collections available for sharing
                  </div>
                )}
                {isSubscriber && masterCollectionUid && (
                  <div className="mt-1 text-xs text-muted">
                    Synced from {findCollectionByUid(collections, masterCollectionUid)?.name || 'master collection'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {showShareCollectionModal && <ShareCollection collectionUid={collection.uid} onClose={handleToggleShowShareCollectionModal(false)} />}
        </div>
      </div>
    </div>
  );
};

export default Info;