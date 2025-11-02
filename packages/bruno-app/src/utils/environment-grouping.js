/**
 * Extract the group name from an environment name based on naming convention.
 * Grouping rule: Prefix before first dash ("-")
 * Example: "VDE-INT-AUTH" → "VDE"
 * Example: "STG-API" → "STG"
 * Example: "Production" → null (ungrouped)
 *
 * @param {string} envName - The environment name
 * @returns {string|null} Group name or null if ungrouped
 */
export const getEnvironmentGroup = (envName) => {
  if (!envName || typeof envName !== 'string') {
    return null;
  }

  const dashIndex = envName.indexOf('-');
  if (dashIndex > 0) {
    return envName.substring(0, dashIndex);
  }

  return null;
};

/**
 * Group environments by naming convention (prefix before first dash).
 * Returns an object with grouped and ungrouped environments.
 *
 * @param {array} environments - Array of environment objects
 * @returns {object} { grouped: { groupName: [envs] }, ungrouped: [envs] }
 */
export const groupEnvironments = (environments) => {
  if (!environments || !Array.isArray(environments)) {
    return { grouped: {}, ungrouped: [] };
  }

  const grouped = {};
  const ungrouped = [];

  environments.forEach((env) => {
    const groupName = getEnvironmentGroup(env.name);

    if (groupName) {
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(env);
    } else {
      ungrouped.push(env);
    }
  });

  return { grouped, ungrouped };
};

/**
 * Filter environments by search text.
 * Matches against environment name and variables.
 *
 * @param {array} environments - Array of environment objects
 * @param {string} searchText - Search query (case-insensitive)
 * @returns {array} Filtered environments
 */
export const filterEnvironments = (environments, searchText) => {
  if (!searchText || !searchText.trim()) {
    return environments;
  }

  const query = searchText.toLowerCase().trim();

  return environments.filter((env) => {
    // Match by environment name
    if (env.name && env.name.toLowerCase().includes(query)) {
      return true;
    }

    // Match by variable names or values
    if (env.variables && Array.isArray(env.variables)) {
      return env.variables.some((variable) => {
        return (
          (variable.name && variable.name.toLowerCase().includes(query))
          || (variable.value && variable.value.toLowerCase().includes(query))
        );
      });
    }

    return false;
  });
};

/**
 * Check if a group has any matching environments based on search.
 *
 * @param {array} groupEnvironments - Array of environments in the group
 * @param {string} searchText - Search query
 * @returns {boolean} True if group has matches
 */
export const groupHasMatches = (groupEnvironments, searchText) => {
  if (!searchText || !searchText.trim()) {
    return true; // No filter, all groups have matches
  }

  const filtered = filterEnvironments(groupEnvironments, searchText);
  return filtered.length > 0;
};

/**
 * Sort group names alphabetically.
 *
 * @param {array} groupNames - Array of group name strings
 * @returns {array} Sorted group names
 */
export const sortGroupNames = (groupNames) => {
  if (!groupNames || !Array.isArray(groupNames)) {
    return [];
  }

  return [...groupNames].sort((a, b) => a.localeCompare(b));
};
