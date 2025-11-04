/**
 * Export Bruno environments to JSON file
 *
 * This utility exports collection environments in Bruno's native format,
 * preserving all environment variables and metadata.
 */

import * as FileSaver from 'file-saver';
import { each } from 'lodash';

/**
 * Remove UIDs from environment variables for clean export
 * @param {Array} variables - Environment variables array
 */
export const deleteUidsInVariables = (variables) => {
  each(variables, (variable) => delete variable.uid);
};

/**
 * Remove secret values from environment for security
 * @param {Object} environment - Environment object
 */
export const clearSecretValues = (environment) => {
  each(environment.variables, (variable) => {
    if (variable.secret) {
      variable.value = '';
    }
  });
};

/**
 * Export a single environment to JSON file
 * @param {Object} environment - Environment object to export
 * @param {Object} options - Export options
 * @param {boolean} options.includeSecrets - Whether to include secret values (default: false)
 */
export const exportEnvironment = (environment, options = {}) => {
  const { includeSecrets = false } = options;

  // Create a copy to avoid mutating the original
  const envCopy = JSON.parse(JSON.stringify(environment));

  // Delete UIDs for clean export
  delete envCopy.uid;
  deleteUidsInVariables(envCopy.variables || []);

  // Clear secret values unless explicitly requested
  if (!includeSecrets) {
    clearSecretValues(envCopy);
  }

  // Add metadata
  const exportData = {
    version: '1',
    type: 'environment',
    name: envCopy.name,
    variables: envCopy.variables || [],
    exportedAt: new Date().toISOString()
  };

  const fileName = `${environment.name}.json`;
  const fileBlob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });

  FileSaver.saveAs(fileBlob, fileName);
};

/**
 * Export multiple environments to a single JSON file
 * @param {Array} environments - Array of environment objects
 * @param {string} collectionName - Name of the collection (for filename)
 * @param {Object} options - Export options
 */
export const exportEnvironments = (environments, collectionName, options = {}) => {
  const { includeSecrets = false } = options;

  const envsCopy = environments.map((env) => {
    const envCopy = JSON.parse(JSON.stringify(env));
    delete envCopy.uid;
    deleteUidsInVariables(envCopy.variables || []);

    if (!includeSecrets) {
      clearSecretValues(envCopy);
    }

    return {
      name: envCopy.name,
      variables: envCopy.variables || []
    };
  });

  const exportData = {
    version: '1',
    type: 'environments',
    environments: envsCopy,
    exportedAt: new Date().toISOString(),
    collectionName: collectionName
  };

  const fileName = `${collectionName}-environments.json`;
  const fileBlob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });

  FileSaver.saveAs(fileBlob, fileName);
};

export default exportEnvironment;
