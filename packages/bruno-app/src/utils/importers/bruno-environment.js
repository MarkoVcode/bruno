/**
 * Import Bruno environments from JSON file
 *
 * This utility imports collection environments in Bruno's native format,
 * validating the structure and providing clear error messages.
 */

import fileDialog from 'file-dialog';
import { BrunoError } from 'utils/common/error';
import { uuid } from 'utils/common';

/**
 * Validate environment variable structure
 * @param {Object} variable - Variable object to validate
 * @returns {boolean} - True if valid
 */
const validateVariable = (variable) => {
  return (
    variable &&
    typeof variable === 'object' &&
    (typeof variable.name === 'string' || variable.name === undefined) &&
    (typeof variable.value === 'string' || variable.value === undefined || variable.value === null) &&
    (typeof variable.enabled === 'boolean' || variable.enabled === undefined) &&
    (typeof variable.secret === 'boolean' || variable.secret === undefined) &&
    (typeof variable.type === 'string' || variable.type === undefined)
  );
};

/**
 * Validate single environment structure
 * @param {Object} environment - Environment object to validate
 * @returns {Object} - Validation result with isValid and error properties
 */
const validateEnvironment = (environment) => {
  if (!environment || typeof environment !== 'object') {
    return {
      isValid: false,
      error: 'Environment must be an object'
    };
  }

  if (!environment.name || typeof environment.name !== 'string') {
    return {
      isValid: false,
      error: 'Environment must have a valid name (string)'
    };
  }

  if (!Array.isArray(environment.variables)) {
    return {
      isValid: false,
      error: 'Environment variables must be an array'
    };
  }

  // Validate each variable
  for (let i = 0; i < environment.variables.length; i++) {
    const variable = environment.variables[i];
    if (!validateVariable(variable)) {
      return {
        isValid: false,
        error: `Invalid variable at index ${i} in environment "${environment.name}"`
      };
    }
  }

  return { isValid: true };
};

/**
 * Normalize environment variable (add missing fields, generate UIDs)
 * @param {Object} variable - Variable to normalize
 * @returns {Object} - Normalized variable
 */
const normalizeVariable = (variable) => {
  return {
    uid: uuid(),
    name: variable.name || '',
    value: variable.value || '',
    type: variable.type || 'text',
    enabled: variable.enabled !== undefined ? variable.enabled : true,
    secret: variable.secret || false
  };
};

/**
 * Normalize environment structure
 * @param {Object} environment - Environment to normalize
 * @returns {Object} - Normalized environment
 */
const normalizeEnvironment = (environment) => {
  return {
    name: environment.name,
    variables: (environment.variables || []).map(normalizeVariable)
  };
};

/**
 * Parse and validate Bruno environment file
 * @param {Object} data - Parsed JSON data
 * @returns {Array} - Array of validated environments
 */
const parseBrunoEnvironmentFile = (data) => {
  // Handle single environment export
  if (data.type === 'environment') {
    const validation = validateEnvironment(data);
    if (!validation.isValid) {
      throw new BrunoError(validation.error);
    }
    return [normalizeEnvironment(data)];
  }

  // Handle multiple environments export
  if (data.type === 'environments') {
    if (!Array.isArray(data.environments)) {
      throw new BrunoError('Invalid environments file: environments must be an array');
    }

    const environments = [];
    for (const env of data.environments) {
      const validation = validateEnvironment(env);
      if (!validation.isValid) {
        throw new BrunoError(validation.error);
      }
      environments.push(normalizeEnvironment(env));
    }

    return environments;
  }

  // Try to parse as direct environment object (backward compatibility)
  if (data.name && data.variables) {
    const validation = validateEnvironment(data);
    if (!validation.isValid) {
      throw new BrunoError(validation.error);
    }
    return [normalizeEnvironment(data)];
  }

  throw new BrunoError('Invalid Bruno environment file format');
};

/**
 * Read and parse a file
 * @param {File} file - File to read
 * @returns {Promise<Array>} - Promise resolving to array of environments
 */
const readFile = (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target.result);
        const environments = parseBrunoEnvironmentFile(parsedData);
        resolve(environments);
      } catch (err) {
        console.error('Error parsing environment file:', err);
        if (err instanceof BrunoError) {
          reject(err);
        } else {
          reject(new BrunoError('Unable to parse the environment JSON file. Please ensure it is valid Bruno environment format.'));
        }
      }
    };

    fileReader.onerror = (err) => {
      console.error('Error reading file:', err);
      reject(new BrunoError('Failed to read the file'));
    };

    fileReader.readAsText(file);
  });
};

/**
 * Open file dialog and import Bruno environments
 * @returns {Promise<Array>} - Promise resolving to array of environments
 */
const importBrunoEnvironment = () => {
  return new Promise((resolve, reject) => {
    fileDialog({ multiple: true, accept: 'application/json' })
      .then((files) => {
        return Promise.all(
          Object.values(files ?? {}).map((file) =>
            readFile(file).catch((err) => {
              console.error(`Error processing file: ${file.name || 'undefined'}`, err);
              throw err;
            })
          )
        );
      })
      .then((results) => {
        // Flatten the array of arrays
        const environments = results.flat();
        resolve(environments);
      })
      .catch((err) => {
        console.error('Import error:', err);
        if (err instanceof BrunoError) {
          reject(err);
        } else {
          reject(new BrunoError('Import environment failed'));
        }
      });
  });
};

export default importBrunoEnvironment;
