import React, { useMemo, useState } from 'react';
import Modal from 'components/Modal';
import { IconDownload, IconLoader2, IconAlertTriangle, IconFileCode } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';
import Bruno from 'components/Bruno';
import exportBrunoCollection from 'utils/collections/export';
import exportPostmanCollection from 'utils/exporters/postman-collection';
import exportOpenApiCollection from 'utils/exporters/openapi-collection';
import { cloneDeep, get } from 'lodash';
import { transformCollectionToSaveToExportAsFile } from 'utils/collections/index';
import { useSelector } from 'react-redux';
import { findCollectionByUid, areItemsLoading } from 'utils/collections/index';
import { toastError } from 'utils/common/error';

const NO_ENVIRONMENT_OPTION = '__no_environment__';

const ShareCollection = ({ onClose, collectionUid }) => {
  const collection = useSelector((state) => findCollectionByUid(state.collections.collections, collectionUid));
  const isCollectionLoading = areItemsLoading(collection);
  const [isOpenApiModalVisible, setIsOpenApiModalVisible] = useState(false);
  const [openApiFormat, setOpenApiFormat] = useState('json');
  const [selectedOpenApiEnvironment, setSelectedOpenApiEnvironment] = useState(NO_ENVIRONMENT_OPTION);
  const [isExportingOpenApi, setIsExportingOpenApi] = useState(false);

  const hasNonExportableRequestTypes = useMemo(() => {
    let types = new Set();
    const checkItem = (item) => {
      if (item.type === 'grpc-request') {
        types.add('gRPC');
        return true;
      }
      if (item.type === 'ws-request') {
        types.add('WebSocket');
        return true;
      }
      if (item.items) {
        return item.items.some(checkItem);
      }
      return false;
    };
    return {
      has: collection?.items?.filter(checkItem).length || false,
      types: [...types]
    };
  }, [collection]);

  const environmentOptions = useMemo(() => {
    const environments = collection?.environments || [];
    const options = environments.map((env) => ({
      value: env.uid,
      label: env.name || 'Untitled Environment'
    }));

    return [
      {
        value: NO_ENVIRONMENT_OPTION,
        label: 'No environment'
      },
      ...options
    ];
  }, [collection]);

  const resolveEnvironmentVariables = (environmentUid) => {
    const variables = {};

    if (environmentUid && environmentUid !== NO_ENVIRONMENT_OPTION) {
      const environment = collection?.environments?.find((env) => env.uid === environmentUid);
      environment?.variables?.forEach((variable) => {
        if (variable?.name && variable.enabled) {
          variables[variable.name] = variable.value ?? '';
        }
      });
    }

    const collectionVars = get(collection, 'root.request.vars.req', []);
    collectionVars?.forEach((variable) => {
      if (variable?.name && variable.enabled) {
        variables[variable.name] = variable.value ?? '';
      }
    });

    return variables;
  };

  const handleExportOpenApi = () => {
    if (isCollectionLoading || !collection) {
      return;
    }

    const activeUid = collection?.activeEnvironmentUid;
    const hasActiveEnvironment = collection?.environments?.some((env) => env.uid === activeUid);
    setSelectedOpenApiEnvironment(hasActiveEnvironment ? activeUid : NO_ENVIRONMENT_OPTION);
    setOpenApiFormat('json');
    setIsOpenApiModalVisible(true);
  };

  const handleExportBrunoCollection = () => {
    const collectionCopy = cloneDeep(collection);
    exportBrunoCollection(transformCollectionToSaveToExportAsFile(collectionCopy));
    onClose();
  };

  const handleExportPostmanCollection = () => {
    const collectionCopy = cloneDeep(collection);
    exportPostmanCollection(collectionCopy);
    onClose();
  };

  const handleConfirmOpenApiExport = () => {
    if (!collection) {
      toastError(new Error('Collection not available'), 'Failed to export OpenAPI specification');
      return;
    }

    const environmentUid =
      selectedOpenApiEnvironment === NO_ENVIRONMENT_OPTION ? null : selectedOpenApiEnvironment;
    const variables = resolveEnvironmentVariables(environmentUid);
    const environmentName = environmentUid
      ? collection?.environments?.find((env) => env.uid === environmentUid)?.name
      : undefined;

    try {
      setIsExportingOpenApi(true);
      const collectionCopy = cloneDeep(collection);
      exportOpenApiCollection({
        collection: collectionCopy,
        format: openApiFormat,
        variables,
        environmentName
      });
      setIsOpenApiModalVisible(false);
      onClose();
    } catch (err) {
      toastError(err, 'Failed to export OpenAPI specification');
    } finally {
      setIsExportingOpenApi(false);
    }
  };

  return (
    <>
      <Modal
        size="md"
        title="Share Collection"
        confirmText="Close"
        handleConfirm={onClose}
        handleCancel={onClose}
        hideCancel
      >
        <StyledWrapper className="flex flex-col h-full w-[500px]">
          <div className="space-y-2">
            <div
              className={`flex border border-gray-200 dark:border-gray-600 items-center p-3 rounded-lg transition-colors ${
                isCollectionLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-500/10 cursor-pointer'
              }`}
              onClick={isCollectionLoading ? undefined : handleExportBrunoCollection}
            >
              <div className="mr-3 p-1 rounded-full">
                {isCollectionLoading ? <IconLoader2 size={28} className="animate-spin" /> : <Bruno width={28} />}
              </div>
              <div className="flex-1">
                <div className="font-medium">Bruno Collection</div>
                <div className="text-xs">
                  {isCollectionLoading ? 'Loading collection...' : 'Export in Bruno format'}
                </div>
              </div>
            </div>

            <div
              className={`flex flex-col border border-gray-200 dark:border-gray-600 items-center rounded-lg transition-colors ${
                isCollectionLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-500/10 cursor-pointer'
              }`}
              onClick={isCollectionLoading ? undefined : handleExportPostmanCollection}
            >
              {hasNonExportableRequestTypes.has && (
                <div className="px-3 py-2 bg-yellow-50 w-full dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs border-b border-yellow-100 dark:border-yellow-800/20 flex items-center">
                  <IconAlertTriangle size={16} className="mr-2 flex-shrink-0" />
                  <span>
                    Note:
                    {hasNonExportableRequestTypes.types.join(', ')}
                    {' '}
                    requests in this collection will not be exported
                  </span>
                </div>
              )}
              <div className="flex items-center p-3 w-full">
                <div className="mr-3 p-1 rounded-full">
                  {isCollectionLoading ? (
                    <IconLoader2 size={28} className="animate-spin" />
                  ) : (
                    <IconDownload size={28} strokeWidth={1} className="" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">Postman Collection</div>
                  <div className="text-xs">
                    {isCollectionLoading ? 'Loading collection...' : 'Export in Postman format'}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`flex flex-col border border-gray-200 dark:border-gray-600 items-center rounded-lg transition-colors ${
                isCollectionLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-500/10 cursor-pointer'
              }`}
              onClick={isCollectionLoading || isExportingOpenApi ? undefined : handleExportOpenApi}
            >
              {hasNonExportableRequestTypes.has && (
                <div className="px-3 py-2 bg-yellow-50 w-full dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs border-b border-yellow-100 dark:border-yellow-800/20 flex items-center">
                  <IconAlertTriangle size={16} className="mr-2 flex-shrink-0" />
                  <span>
                    Note:
                    {hasNonExportableRequestTypes.types.join(', ')}
                    {' '}
                    requests in this collection will not be exported
                  </span>
                </div>
              )}
              <div className="flex items-center p-3 w-full">
                <div className="mr-3 p-1 rounded-full">
                  {isCollectionLoading || isExportingOpenApi ? (
                    <IconLoader2 size={28} className="animate-spin" />
                  ) : (
                    <IconFileCode size={28} strokeWidth={1} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">OpenAPI Specification</div>
                  <div className="text-xs">
                    {isCollectionLoading ? 'Loading collection...' : 'Export as JSON or YAML'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </StyledWrapper>
      </Modal>

      {isOpenApiModalVisible && (
        <Modal
          size="sm"
          title="Export OpenAPI Specification"
          hideFooter={true}
          handleCancel={() => setIsOpenApiModalVisible(false)}
        >
          <div className="flex flex-col space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Format</label>
              <select
                value={openApiFormat}
                onChange={(event) => setOpenApiFormat(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="json">JSON (.openapi.json)</option>
                <option value="yaml">YAML (.openapi.yaml)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Environment</label>
              <select
                value={selectedOpenApiEnvironment}
                onChange={(event) => setSelectedOpenApiEnvironment(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {environmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enabled variables from the selected environment will be substituted. Unresolved placeholders remain in
                the exported spec.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                onClick={() => setIsOpenApiModalVisible(false)}
                disabled={isExportingOpenApi}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                onClick={handleConfirmOpenApiExport}
                disabled={isExportingOpenApi}
              >
                {isExportingOpenApi && <IconLoader2 size={16} className="animate-spin mr-2" />}
                Export
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ShareCollection;
