const fs = require('fs');
const path = require('path');
const jsyaml = require('js-yaml');

/**
 * Check if a collection is read-only based on OpenAPI spec
 *
 * A collection is read-only if:
 * 1. It has an openapi.yaml file in the root AND the OpenAPI spec's info.title matches the collection name exactly
 * OR
 * 2. It has openapiSource.url in bruno.json (imported from URL)
 *
 * @param {string} collectionPath - Absolute path to collection directory
 * @param {string} collectionName - Name of the collection
 * @returns {boolean} - True if collection should be read-only
 */
function isReadOnlyCollection(collectionPath, collectionName) {
  try {
    // Check for URL-based source in bruno.json
    const brunoJsonPath = path.join(collectionPath, 'bruno.json');
    if (fs.existsSync(brunoJsonPath)) {
      try {
        const brunoJsonContent = fs.readFileSync(brunoJsonPath, 'utf8');
        const brunoConfig = JSON.parse(brunoJsonContent);

        // If collection has a remote URL source, it's read-only
        if (brunoConfig.openapiSource && brunoConfig.openapiSource.url) {
          return true;
        }
      } catch (brunoJsonError) {
        // Continue to check openapi.yaml method
        console.warn('Error reading bruno.json for read-only check:', brunoJsonError);
      }
    }

    // Fallback to checking openapi.yaml method
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
