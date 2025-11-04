import React from 'react';
import Portal from 'components/Portal';
import Modal from 'components/Modal';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import importPostmanEnvironment from 'utils/importers/postman-environment';
import importBrunoEnvironment from 'utils/importers/bruno-environment';
import { importEnvironment } from 'providers/ReduxStore/slices/collections/actions';
import { toastError } from 'utils/common/error';
import { IconDatabaseImport, IconFileImport } from '@tabler/icons';

const ImportEnvironment = ({ collection, onClose, onEnvironmentCreated }) => {
  const dispatch = useDispatch();

  const handleImportPostmanEnvironment = () => {
    importPostmanEnvironment()
      .then((environments) => {
        environments
          .filter((env) =>
            env.name && env.name !== 'undefined'
              ? true
              : () => {
                  toast.error('Failed to import environment: env has no name');
                  return false;
                }
          )
          .map((environment) => {
            dispatch(importEnvironment(environment.name, environment.variables, collection.uid))
              .then(() => {
                toast.success('Environment imported successfully');
              })
              .catch((error) => {
                toast.error('An error occurred while importing the environment');
                console.error(error);
              });
          });
      })
      .then(() => {
        onClose();
        // Call the callback if provided
        if (onEnvironmentCreated) {
          onEnvironmentCreated();
        }
      })
      .catch((err) => toastError(err, 'Postman Import environment failed'));
  };

  const handleImportBrunoEnvironment = () => {
    importBrunoEnvironment()
      .then((environments) => {
        if (!environments || environments.length === 0) {
          toast.error('No valid environments found in the file');
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        environments
          .filter((env) => {
            if (!env.name || env.name === 'undefined') {
              toast.error('Failed to import environment: env has no name');
              errorCount++;
              return false;
            }
            return true;
          })
          .forEach((environment) => {
            dispatch(importEnvironment(environment.name, environment.variables, collection.uid))
              .then(() => {
                successCount++;
                if (successCount === 1 && environments.length === 1) {
                  toast.success(`Environment "${environment.name}" imported successfully`);
                } else if (successCount + errorCount === environments.length) {
                  toast.success(`${successCount} environment(s) imported successfully`);
                }
              })
              .catch((error) => {
                errorCount++;
                toast.error(`Failed to import "${environment.name}": ${error.message || 'Unknown error'}`);
                console.error(error);
              });
          });
      })
      .then(() => {
        onClose();
        // Call the callback if provided
        if (onEnvironmentCreated) {
          onEnvironmentCreated();
        }
      })
      .catch((err) => toastError(err, 'Bruno Import environment failed'));
  };

  return (
    <Portal>
      <Modal size="sm" title="Import Environment" hideFooter={true} handleConfirm={onClose} handleCancel={onClose} dataTestId="import-environment-modal">
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleImportBrunoEnvironment}
            className="flex justify-center flex-col items-center w-full dark:bg-zinc-700 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-400 p-8 text-center hover:border-zinc-400 dark:hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            data-testid="import-bruno-environment"
          >
            <IconFileImport size={48} strokeWidth={1.5} />
            <span className="mt-2 block text-sm font-semibold">Import Bruno Environment</span>
            <span className="mt-1 block text-xs text-gray-600 dark:text-gray-400">
              Import environment(s) in Bruno format
            </span>
          </button>

          <button
            type="button"
            onClick={handleImportPostmanEnvironment}
            className="flex justify-center flex-col items-center w-full dark:bg-zinc-700 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-400 p-8 text-center hover:border-zinc-400 dark:hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            data-testid="import-postman-environment"
          >
            <IconDatabaseImport size={48} strokeWidth={1.5} />
            <span className="mt-2 block text-sm font-semibold">Import Postman Environment</span>
            <span className="mt-1 block text-xs text-gray-600 dark:text-gray-400">
              Import environment(s) from Postman
            </span>
          </button>
        </div>
      </Modal>
    </Portal>
  );
};

export default ImportEnvironment;
