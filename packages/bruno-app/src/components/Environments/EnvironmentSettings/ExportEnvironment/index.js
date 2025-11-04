/**
 * Export Environment Component
 *
 * Provides UI for exporting collection environments in Bruno format.
 * Allows exporting single or all environments.
 */

import React, { useState } from 'react';
import Portal from 'components/Portal';
import Modal from 'components/Modal';
import toast from 'react-hot-toast';
import { exportEnvironment, exportEnvironments } from 'utils/exporters/bruno-environment';
import { IconDatabaseExport, IconFileExport, IconFiles } from '@tabler/icons';

const ExportEnvironment = ({ collection, selectedEnvironment = null, onClose }) => {
  const [includeSecrets, setIncludeSecrets] = useState(false);
  const { environments } = collection;
  const hasEnvironments = environments && environments.length > 0;

  const handleExportSelected = () => {
    if (!selectedEnvironment) {
      toast.error('No environment selected');
      return;
    }

    try {
      exportEnvironment(selectedEnvironment, { includeSecrets });
      toast.success(`Environment "${selectedEnvironment.name}" exported successfully`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export environment');
    }
  };

  const handleExportAll = () => {
    if (!environments || environments.length === 0) {
      toast.error('No environments to export');
      return;
    }

    try {
      exportEnvironments(environments, collection.name, { includeSecrets });
      toast.success(`All ${environments.length} environment(s) exported successfully`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export environments');
    }
  };

  return (
    <Portal>
      <Modal
        size="sm"
        title="Export Environment"
        hideFooter={true}
        handleConfirm={onClose}
        handleCancel={onClose}
        dataTestId="export-environment-modal"
      >
        {!hasEnvironments ? (
          <div className="text-center py-6">
            <p className="text-zinc-700 dark:text-zinc-300">
              There are no environments found for the collection
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Secret handling option */}
            <div className="flex items-start p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="include-secrets"
                    checked={includeSecrets}
                    onChange={(e) => setIncludeSecrets(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="include-secrets" className="text-sm font-medium cursor-pointer">
                    Include secret values
                  </label>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-6">
                  {includeSecrets
                    ? '⚠️ Secret values will be included in plain text'
                    : 'Secret values will be cleared for security'
                  }
                </p>
              </div>
            </div>

            {/* Export all environments - primary action when no selected environment */}
            <button
              type="button"
              onClick={handleExportAll}
              className="flex justify-center flex-col items-center w-full dark:bg-zinc-700 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-400 p-8 text-center hover:border-zinc-400 dark:hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
              data-testid="export-all-environments"
            >
              <IconFiles size={48} strokeWidth={1.5} />
              <span className="mt-2 block text-sm font-semibold">
                Export All Environments
              </span>
              <span className="mt-1 block text-xs text-gray-600 dark:text-gray-400">
                {environments.length} environment(s)
              </span>
            </button>

            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Exports will be saved in Bruno's native JSON format
            </div>
          </div>
        )}
      </Modal>
    </Portal>
  );
};

export default ExportEnvironment;
