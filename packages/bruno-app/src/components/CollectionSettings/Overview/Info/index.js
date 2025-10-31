import React from "react";
import { getTotalRequestCountInCollection } from 'utils/collections/';
import { IconFolder, IconWorld, IconApi, IconShare, IconFileCode } from '@tabler/icons';
import { areItemsLoading, getItemsLoadStats } from "utils/collections/index";
import { useState, useEffect } from 'react';
import ShareCollection from "components/ShareCollection/index";
import { useDispatch } from 'react-redux';
import { updateSettingsSelectedTab } from 'providers/ReduxStore/slices/collections';

const Info = ({ collection }) => {
  const dispatch = useDispatch();
  const totalRequestsInCollection = getTotalRequestCountInCollection(collection);

  const isCollectionLoading = areItemsLoading(collection);
  const { loading: itemsLoadingCount, total: totalItems } = getItemsLoadStats(collection);
  const [showShareCollectionModal, toggleShowShareCollectionModal] = useState(false);
  const [hasOpenApi, setHasOpenApi] = useState(false);

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
  }, [collection.pathname]);

  const handleToggleShowShareCollectionModal = (value) => (e) => {
    toggleShowShareCollectionModal(value);
  };

  const handleOpenApiDocClick = () => {
    dispatch(updateSettingsSelectedTab({
      collectionUid: collection.uid,
      tab: 'apidoc'
    }));
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

          <div className="flex items-start group cursor-pointer" onClick={handleToggleShowShareCollectionModal(true)}>
            <div className="flex-shrink-0 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <IconShare className="w-5 h-5 text-indigo-500" stroke={1.5} />
            </div>
            <div className="ml-4 h-full flex flex-col justify-start">
              <div className="font-semibold text-sm h-fit my-auto">Share</div>
              <div className="mt-1 text-sm group-hover:underline text-link">
                Share Collection
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