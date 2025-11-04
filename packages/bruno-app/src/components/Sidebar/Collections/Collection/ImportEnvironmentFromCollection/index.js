import React, { useState } from 'react';
import Portal from 'components/Portal';
import Modal from 'components/Modal';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import importBrunoEnvironment from 'utils/importers/bruno-environment';
import { importEnvironment } from 'providers/ReduxStore/slices/collections/actions';
import { toastError } from 'utils/common/error';
import { IconDatabaseImport } from '@tabler/icons';

const ImportEnvironmentFromCollection = ({ collection, onClose }) => {
  const dispatch = useDispatch();
  const [isImporting, setIsImporting] = useState(false);

  const handleImportBrunoEnvironment = async () => {
    if (isImporting) return;

    setIsImporting(true);

    try {
      const environments = await importBrunoEnvironment();

      if (!environments || environments.length === 0) {
        toast.error('No environments found in the selected file(s)');
        setIsImporting(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const environment of environments) {
        if (!environment.name || environment.name === 'undefined') {
          toast.error(`Skipped environment: missing or invalid name`);
          errorCount++;
          continue;
        }

        try {
          await dispatch(importEnvironment(environment.name, environment.variables, collection.uid));
          successCount++;
        } catch (error) {
          console.error(`Failed to import environment "${environment.name}":`, error);
          errors.push({ name: environment.name, error: error.message });
          errorCount++;
        }
      }

      // Show summary
      if (successCount > 0) {
        const message = successCount === 1
          ? 'Environment imported successfully'
          : `${successCount} environments imported successfully`;
        toast.success(message);
      }

      if (errorCount > 0) {
        const message = errorCount === 1
          ? 'Failed to import 1 environment'
          : `Failed to import ${errorCount} environments`;
        toast.error(message);

        // Log detailed errors
        errors.forEach(({ name, error }) => {
          console.error(`Environment "${name}": ${error}`);
        });
      }

      // Close modal if at least one environment was imported successfully
      if (successCount > 0) {
        onClose();
      }
    } catch (err) {
      console.error('Import failed:', err);
      toastError(err, 'Environment import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Portal>
      <Modal
        size="sm"
        title="Import Environment"
        hideFooter={true}
        handleConfirm={onClose}
        handleCancel={onClose}
        dataTestId="import-environment-from-collection-modal"
      >
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Import environments from Bruno JSON files. Existing environments with the same name will be overridden.
        </div>
        <button
          type="button"
          onClick={handleImportBrunoEnvironment}
          disabled={isImporting}
          className="flex justify-center flex-col items-center w-full dark:bg-zinc-700 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-400 p-12 text-center hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="import-bruno-environment"
        >
          <IconDatabaseImport size={64} />
          <span className="mt-2 block text-sm font-semibold">
            {isImporting ? 'Importing...' : 'Import Bruno environments'}
          </span>
          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
            Select one or more .json files
          </span>
        </button>
      </Modal>
    </Portal>
  );
};

export default ImportEnvironmentFromCollection;
