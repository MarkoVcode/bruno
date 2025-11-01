import React, { useState, useEffect, useRef } from 'react';
import { IconFileImport, IconWorld } from '@tabler/icons';
import { toastError } from 'utils/common/error';
import Modal from 'components/Modal';
import jsyaml from 'js-yaml';
import { postmanToBruno, isPostmanCollection } from 'utils/importers/postman-collection';
import { convertInsomniaToBruno, isInsomniaCollection } from 'utils/importers/insomnia-collection';
import { convertOpenapiToBruno, isOpenApiSpec } from 'utils/importers/openapi-collection';
import { isWSDLCollection } from 'utils/importers/wsdl-collection';
import { processBrunoCollection } from 'utils/importers/bruno-collection';
import { wsdlToBruno } from '@usebruno/converters';
import ImportSettings from 'components/Sidebar/ImportSettings';
import FullscreenLoader from './FullscreenLoader/index';

const convertFileToObject = async (file) => {
  const text = await file.text();

  // Handle WSDL files - return as plain text
  if (file.name.endsWith('.wsdl') || file.type === 'text/xml' || file.type === 'application/xml') {
    return text;
  }

  try {
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      return JSON.parse(text);
    }

    const parsed = jsyaml.load(text);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error();
    }
    return parsed;
  } catch {
    throw new Error('Failed to parse the file – ensure it is valid JSON or YAML');
  }
};

const ImportCollection = ({ onClose, handleSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showImportSettings, setShowImportSettings] = useState(false);
  const [openApiData, setOpenApiData] = useState(null);
  const [openApiFormat, setOpenApiFormat] = useState(null); // 'json' or 'yaml'
  const [openApiUrl, setOpenApiUrl] = useState(null); // Store the source URL
  const [groupingType, setGroupingType] = useState('tags');
  const [importSource, setImportSource] = useState('file'); // 'file' or 'url'
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleImportSettings = () => {
    try {
      const collection = convertOpenapiToBruno(openApiData, { groupBy: groupingType });
      // Pass both the converted collection and the original OpenAPI spec
      handleSubmit({
        collection,
        openapiSpec: openApiData,
        openapiFormat: openApiFormat,
        openapiUrl: openApiUrl // Include URL if imported from URL
      });
    } catch (err) {
      console.error(err);
      toastError(err, 'Failed to process OpenAPI specification');
    }
  };

  const processFile = async (file) => {
    setIsLoading(true);
    try {
      const data = await convertFileToObject(file);

      if (!data) {
        throw new Error('Failed to parse file content');
      }

      // Check if it's an OpenAPI spec and show settings
      if (isOpenApiSpec(data)) {
        // Detect file format based on file extension
        const isJsonFile = file.name.endsWith('.json') || file.type === 'application/json';
        setOpenApiData(data);
        setOpenApiFormat(isJsonFile ? 'json' : 'yaml');
        setIsLoading(false);
        setShowImportSettings(true);
        return;
      }

      let collection;
      if (isWSDLCollection(data)) {
        collection = await wsdlToBruno(data);
      } else if (isPostmanCollection(data)) {
        collection = await postmanToBruno(data);
      } else if (isInsomniaCollection(data)) {
        collection = convertInsomniaToBruno(data);
      } else {
        collection = await processBrunoCollection(data);
      }

      handleSubmit({ collection });
    } catch (err) {
      toastError(err, 'Import collection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleBrowseFiles = () => {
    fileInputRef.current.click();
  };

  const handleFileInputChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      toastError(new Error('Please enter a URL'));
      return;
    }

    // Validate URL format
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(urlInput.trim())) {
      toastError(new Error('URL must start with http:// or https://'));
      return;
    }

    setIsLoading(true);
    try {
      const { ipcRenderer } = window;
      const result = await ipcRenderer.invoke('renderer:fetch-openapi-from-url', urlInput.trim());

      if (!result || !result.spec) {
        throw new Error('Failed to fetch OpenAPI specification from URL');
      }

      // Store the URL for later use
      setOpenApiUrl(urlInput.trim());
      setOpenApiData(result.spec);
      setOpenApiFormat(result.format);
      setIsLoading(false);
      setShowImportSettings(true);
    } catch (err) {
      toastError(err, 'Failed to import from URL');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <FullscreenLoader isLoading={isLoading} />;
  }

  const acceptedFileTypes = [
    '.json',
    '.yaml',
    '.yml',
    '.wsdl',
    'application/json',
    'application/yaml',
    'application/x-yaml',
    'text/xml',
    'application/xml'
  ];

  if (showImportSettings) {
    return (
      <ImportSettings
        groupingType={groupingType}
        setGroupingType={setGroupingType}
        onClose={onClose}
        onConfirm={handleImportSettings}
      />
    );
  }

  return (
    <Modal size="sm" title="Import Collection" hideFooter={true} handleCancel={onClose} dataTestId="import-collection-modal">
      <div className="flex flex-col">
        {/* Tab buttons */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              importSource === 'file'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setImportSource('file')}
          >
            <div className="flex items-center gap-2">
              <IconFileImport size={16} />
              From File
            </div>
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              importSource === 'url'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setImportSource('url')}
          >
            <div className="flex items-center gap-2">
              <IconWorld size={16} />
              From URL
            </div>
          </button>
        </div>

        {/* File import section */}
        {importSource === 'file' && (
          <div className="mb-4">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-6 transition-colors duration-200
                ${dragActive ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}
              `}
            >
              <div className="flex flex-col items-center justify-center">
                <IconFileImport
                  size={28}
                  className="text-gray-400 dark:text-gray-500 mb-3"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileInputChange}
                  accept={acceptedFileTypes.join(',')}
                />
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Drop file to import or{' '}
                  <button
                    className="text-blue-500 underline cursor-pointer"
                    onClick={handleBrowseFiles}
                  >
                    choose a file
                  </button>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Supports Bruno, Postman, Insomnia, OpenAPI v3, and WSDL formats
                </p>
              </div>
            </div>
          </div>
        )}

        {/* URL import section */}
        {importSource === 'url' && (
          <div className="mb-4">
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex flex-col items-center justify-center">
                <IconWorld
                  size={28}
                  className="text-gray-400 dark:text-gray-500 mb-3"
                />
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Import OpenAPI specification from URL
                </p>
                <input
                  type="text"
                  placeholder="https://api.example.com/openapi.json"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleUrlImport}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Import from URL
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Supports OpenAPI v3 in JSON or YAML format
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportCollection;
