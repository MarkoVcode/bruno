import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addTab, focusTab } from 'providers/ReduxStore/slices/tabs';
import { findItemInCollection, findCollectionByUid } from 'utils/collections';
import { useSelector } from 'react-redux';
import StyledWrapper from './StyledWrapper';

const ApiDocCustom = ({ collection }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spec, setSpec] = useState(null);
  const [OpenAPIViewer, setOpenAPIViewer] = useState(null);
  const dispatch = useDispatch();
  const collections = useSelector((state) => state.collections.collections);

  useEffect(() => {
    const loadOpenApiSpec = async () => {
      try {
        setLoading(true);
        setError(null);

        const { ipcRenderer } = window;

        // Request the OpenAPI spec content from the backend
        const specData = await ipcRenderer.invoke('renderer:get-openapi-spec', collection.pathname);

        if (!specData) {
          setError('OpenAPI specification not found');
          setLoading(false);
          return;
        }

        // Dynamically import our custom OpenAPI viewer
        const { OpenAPIExplorer } = await import('@usebruno/openapi-docs');

        setSpec(specData);
        setOpenAPIViewer(() => OpenAPIExplorer);
        setLoading(false);
      } catch (err) {
        console.error('Error loading OpenAPI spec:', err);
        setError(err.message || 'Failed to load OpenAPI documentation');
        setLoading(false);
      }
    };

    loadOpenApiSpec();
  }, [collection.pathname]);

  const handleOpenRequest = (path, method) => {
    // Convert OpenAPI path format ({param}) to Bruno format (:param)
    const brunoPath = path.replace(/\{([^}]+)\}/g, ':$1');

    // Search for matching request in collection
    const item = findMatchingRequest(collection, brunoPath, method.toUpperCase());

    if (item) {
      // Open the request in a new tab
      dispatch(addTab({
        uid: item.uid,
        collectionUid: collection.uid,
        type: item.type
      }));
      dispatch(focusTab({ uid: item.uid }));
    }
  };

  // Helper function to find matching Bruno request
  const findMatchingRequest = (collection, path, method) => {
    const searchItems = (items) => {
      for (const item of items) {
        if (item.type === 'http-request' || item.type === 'graphql-request') {
          // Check if path and method match
          const itemPath = item.draft?.request?.url || item.request?.url || '';
          const itemMethod = item.draft?.request?.method || item.request?.method || '';

          // Extract path from full URL
          const urlPath = itemPath.split('?')[0].split('#')[0];
          const pathWithoutProtocol = urlPath.replace(/^https?:\/\/[^/]+/, '');

          if (pathWithoutProtocol === path && itemMethod === method) {
            return item;
          }
        }

        if (item.items && item.items.length > 0) {
          const found = searchItems(item.items);
          if (found) return found;
        }
      }
      return null;
    };

    return searchItems(collection.items || []);
  };

  if (loading) {
    return (
      <StyledWrapper>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-muted">Loading API Documentation...</p>
          </div>
        </div>
      </StyledWrapper>
    );
  }

  if (error) {
    return (
      <StyledWrapper>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠</div>
            <p className="text-muted">{error}</p>
          </div>
        </div>
      </StyledWrapper>
    );
  }

  if (!OpenAPIViewer || !spec) {
    return (
      <StyledWrapper>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted">No API documentation available</p>
          </div>
        </div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <OpenAPIViewer spec={spec} onOpenRequest={handleOpenRequest} />
    </StyledWrapper>
  );
};

export default ApiDocCustom;
