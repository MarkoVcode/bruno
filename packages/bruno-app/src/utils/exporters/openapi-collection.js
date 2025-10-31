import * as FileSaver from 'file-saver';
import jsyaml from 'js-yaml';
import cloneDeep from 'lodash/cloneDeep';
import { brunoToOpenApi } from '@usebruno/converters';
import { transformCollectionToSaveToExportAsFile } from 'utils/collections/index';

const sanitizeFilePiece = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/[\\/:*?"<>|]+/g, '-');
};

const exportOpenApiCollection = ({ collection, format = 'json', variables = {}, environmentName } = {}) => {
  if (!collection) {
    throw new Error('Collection is required to export OpenAPI specification');
  }

  const collectionCopy = cloneDeep(collection);
  const normalizedCollection = transformCollectionToSaveToExportAsFile(collectionCopy);
  const openApiSpec = brunoToOpenApi(normalizedCollection, { variables });

  const extension = format === 'yaml' ? 'yaml' : 'json';
  const serialized =
    extension === 'yaml'
      ? jsyaml.dump(openApiSpec, { skipInvalid: true })
      : JSON.stringify(openApiSpec, null, 2);

  const contentType = extension === 'yaml' ? 'application/yaml' : 'application/json';

  const baseName = sanitizeFilePiece(collection.name) || 'collection';
  const envSuffix = environmentName ? `.${sanitizeFilePiece(environmentName)}` : '';
  const fileName = `${baseName}${envSuffix}.openapi.${extension}`;

  const fileBlob = new Blob([serialized], { type: contentType });
  FileSaver.saveAs(fileBlob, fileName);
};

export default exportOpenApiCollection;
