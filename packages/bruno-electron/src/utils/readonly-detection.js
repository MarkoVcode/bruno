const fs = require('fs');
const path = require('path');
const jsyaml = require('js-yaml');

/**
 * Check if a collection is read-only based on OpenAPI spec
 *
 * A collection is read-only if:
 * 1. It has an openapi.yaml file in the root
 * 2. The OpenAPI spec's info.title matches the collection name exactly
 *
 * @param {string} collectionPath - Absolute path to collection directory
 * @param {string} collectionName - Name of the collection
 * @returns {boolean} - True if collection should be read-only
 */
function isReadOnlyCollection(collectionPath, collectionName) {
  try {
    const openapiPath = path.join(collectionPath, 'openapi.yaml');

    // Check if openapi.yaml exists
    if (!fs.existsSync(openapiPath)) {
      return false;
    }

    // Read and parse the OpenAPI spec
    const openapiContent = fs.readFileSync(openapiPath, 'utf8');
    const openapiSpec = jsyaml.load(openapiContent);

    // Check if spec has info.title
    if (!openapiSpec || !openapiSpec.info || !openapiSpec.info.title) {
      return false;
    }

    // Compare spec title with collection name (exact match, case-sensitive)
    return openapiSpec.info.title === collectionName;
  } catch (error) {
    // If any error occurs (file read, YAML parse, etc.), treat as not read-only
    console.error('Error checking read-only status:', error);
    return false;
  }
}

/**
 * Get OpenAPI spec details from a collection
 *
 * @param {string} collectionPath - Absolute path to collection directory
 * @returns {Object|null} - OpenAPI spec object or null if not found
 */
function getOpenapiSpec(collectionPath) {
  try {
    const openapiPath = path.join(collectionPath, 'openapi.yaml');

    if (!fs.existsSync(openapiPath)) {
      return null;
    }

    const openapiContent = fs.readFileSync(openapiPath, 'utf8');
    return jsyaml.load(openapiContent);
  } catch (error) {
    console.error('Error reading OpenAPI spec:', error);
    return null;
  }
}

module.exports = {
  isReadOnlyCollection,
  getOpenapiSpec
};
