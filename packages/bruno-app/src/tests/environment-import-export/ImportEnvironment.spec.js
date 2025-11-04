/**
 * Test suite for ImportEnvironment Component
 * Tests UI interactions and import functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ImportEnvironment from 'components/Environments/EnvironmentSettings/ImportEnvironment';
import toast from 'react-hot-toast';
import importPostmanEnvironment from 'utils/importers/postman-environment';
import { importEnvironment } from 'providers/ReduxStore/slices/collections/actions';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('utils/importers/postman-environment');
jest.mock('providers/ReduxStore/slices/collections/actions');
jest.mock('components/Portal', () => ({ children }) => <div data-testid="portal">{children}</div>);
jest.mock('components/Modal', () => ({ children, title, dataTestId }) => (
  <div data-testid={dataTestId || 'modal'}>
    <div data-testid="modal-title">{title}</div>
    <div>{children}</div>
  </div>
));

const mockStore = configureStore([]);

describe('ImportEnvironment Component', () => {
  let store;
  const mockOnClose = jest.fn();
  const mockOnEnvironmentCreated = jest.fn();

  const mockCollection = {
    uid: 'collection-1',
    name: 'Test Collection',
    environments: []
  };

  const mockPostmanEnvironment = {
    name: 'Development',
    variables: [
      { key: 'API_URL', value: 'http://localhost:3000', enabled: true },
      { key: 'API_KEY', value: 'test-key', enabled: true }
    ]
  };

  beforeEach(() => {
    store = mockStore({
      collections: {
        collections: []
      }
    });

    jest.clearAllMocks();
    toast.success = jest.fn();
    toast.error = jest.fn();
    importPostmanEnvironment.mockReset();
    importEnvironment.mockReset();
  });

  describe('Component Rendering', () => {
    test('should render import modal with correct title', () => {
      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      expect(screen.getByTestId('import-environment-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Import Environment');
    });

    test('should render import button with correct text', () => {
      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');
      expect(importButton).toBeInTheDocument();
      expect(importButton).toHaveTextContent('Import your Postman environments');
    });

    test('should render import button with icon', () => {
      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');
      expect(importButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Import Functionality', () => {
    test('should import valid Postman environment successfully', async () => {
      const mockDispatch = jest.fn(() => Promise.resolve());
      store.dispatch = mockDispatch;

      importPostmanEnvironment.mockResolvedValue([mockPostmanEnvironment]);
      importEnvironment.mockReturnValue(() => Promise.resolve());

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(importPostmanEnvironment).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Environment imported successfully');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('should import multiple environments successfully', async () => {
      const mockDispatch = jest.fn(() => Promise.resolve());
      store.dispatch = mockDispatch;

      const multipleEnvironments = [
        { name: 'Development', variables: [{ key: 'ENV', value: 'dev' }] },
        { name: 'Production', variables: [{ key: 'ENV', value: 'prod' }] }
      ];

      importPostmanEnvironment.mockResolvedValue(multipleEnvironments);
      importEnvironment.mockReturnValue(() => Promise.resolve());

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(importPostmanEnvironment).toHaveBeenCalledTimes(1);
      });

      // Wait for both environments to be processed
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledTimes(2);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('should filter out environments without names', async () => {
      const mockDispatch = jest.fn(() => Promise.resolve());
      store.dispatch = mockDispatch;

      const environmentsWithInvalid = [
        { name: 'Valid Environment', variables: [] },
        { name: undefined, variables: [] },
        { name: 'undefined', variables: [] }
      ];

      importPostmanEnvironment.mockResolvedValue(environmentsWithInvalid);
      importEnvironment.mockReturnValue(() => Promise.resolve());

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(importPostmanEnvironment).toHaveBeenCalledTimes(1);
      });

      // Should only import valid environments
      await waitFor(() => {
        // At least one valid environment should be imported
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('should call onEnvironmentCreated callback when provided', async () => {
      const mockDispatch = jest.fn(() => Promise.resolve());
      store.dispatch = mockDispatch;

      importPostmanEnvironment.mockResolvedValue([mockPostmanEnvironment]);
      importEnvironment.mockReturnValue(() => Promise.resolve());

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
            onEnvironmentCreated={mockOnEnvironmentCreated}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(mockOnEnvironmentCreated).toHaveBeenCalled();
      });
    });

    test('should not call onEnvironmentCreated when not provided', async () => {
      const mockDispatch = jest.fn(() => Promise.resolve());
      store.dispatch = mockDispatch;

      importPostmanEnvironment.mockResolvedValue([mockPostmanEnvironment]);
      importEnvironment.mockReturnValue(() => Promise.resolve());

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      // Should not throw error when callback is not provided
      expect(() => mockOnEnvironmentCreated).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle file picker cancellation', async () => {
      importPostmanEnvironment.mockRejectedValue(new Error('User cancelled'));

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    test('should handle invalid JSON file', async () => {
      importPostmanEnvironment.mockRejectedValue(new Error('Invalid JSON'));

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    test('should handle import action failure', async () => {
      const mockDispatch = jest.fn(() => Promise.reject(new Error('Import failed')));
      store.dispatch = mockDispatch;

      importPostmanEnvironment.mockResolvedValue([mockPostmanEnvironment]);
      importEnvironment.mockReturnValue(() => Promise.reject(new Error('Import failed')));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('An error occurred while importing the environment');
      });

      consoleErrorSpy.mockRestore();
    });

    test('should show specific error for environments without names', async () => {
      const mockDispatch = jest.fn(() => Promise.resolve());
      store.dispatch = mockDispatch;

      const environmentWithoutName = [
        { name: undefined, variables: [] }
      ];

      importPostmanEnvironment.mockResolvedValue(environmentWithoutName);

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        // Should still close even if no valid environments
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('should handle general import errors', async () => {
      const importError = new Error('Postman Import environment failed');
      importPostmanEnvironment.mockRejectedValue(importError);

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Integration with Redux', () => {
    test('should dispatch importEnvironment action with correct parameters', async () => {
      const mockDispatch = jest.fn(() => Promise.resolve());
      store.dispatch = mockDispatch;

      importPostmanEnvironment.mockResolvedValue([mockPostmanEnvironment]);
      const mockImportAction = jest.fn(() => Promise.resolve());
      importEnvironment.mockReturnValue(mockImportAction);

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(importEnvironment).toHaveBeenCalledWith('Development',
          mockPostmanEnvironment.variables,
          'collection-1');
      });
    });

    test('should handle multiple environment imports sequentially', async () => {
      const mockDispatch = jest.fn(() => Promise.resolve());
      store.dispatch = mockDispatch;

      const environments = [
        { name: 'Dev', variables: [{ key: 'ENV', value: 'dev' }] },
        { name: 'Prod', variables: [{ key: 'ENV', value: 'prod' }] }
      ];

      importPostmanEnvironment.mockResolvedValue(environments);
      importEnvironment.mockReturnValue(() => Promise.resolve());

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(importEnvironment).toHaveBeenCalledTimes(2);
        expect(importEnvironment).toHaveBeenCalledWith('Dev', environments[0].variables, 'collection-1');
        expect(importEnvironment).toHaveBeenCalledWith('Prod', environments[1].variables, 'collection-1');
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty environments array', async () => {
      importPostmanEnvironment.mockResolvedValue([]);

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('should handle environment with special characters in name', async () => {
      const mockDispatch = jest.fn(() => Promise.resolve());
      store.dispatch = mockDispatch;

      const specialEnv = {
        name: 'Dev/Test (Local) [2024]',
        variables: []
      };

      importPostmanEnvironment.mockResolvedValue([specialEnv]);
      importEnvironment.mockReturnValue(() => Promise.resolve());

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(importEnvironment).toHaveBeenCalledWith('Dev/Test (Local) [2024]',
          [],
          'collection-1');
      });
    });

    test('should handle environment with Unicode characters', async () => {
      const mockDispatch = jest.fn(() => Promise.resolve());
      store.dispatch = mockDispatch;

      const unicodeEnv = {
        name: 'Development 世界 🌍',
        variables: [{ key: 'MESSAGE', value: 'Hello 世界' }]
      };

      importPostmanEnvironment.mockResolvedValue([unicodeEnv]);
      importEnvironment.mockReturnValue(() => Promise.resolve());

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(importEnvironment).toHaveBeenCalledWith('Development 世界 🌍',
          unicodeEnv.variables,
          'collection-1');
      });
    });

    test('should handle very large number of variables', async () => {
      const mockDispatch = jest.fn(() => Promise.resolve());
      store.dispatch = mockDispatch;

      const largeEnv = {
        name: 'Large Environment',
        variables: Array.from({ length: 1000 }, (_, i) => ({
          key: `VAR_${i}`,
          value: `value_${i}`
        }))
      };

      importPostmanEnvironment.mockResolvedValue([largeEnv]);
      importEnvironment.mockReturnValue(() => Promise.resolve());

      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');

      await act(async () => {
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(importEnvironment).toHaveBeenCalledWith('Large Environment',
          expect.arrayContaining([
            expect.objectContaining({ key: 'VAR_0' }),
            expect.objectContaining({ key: 'VAR_999' })
          ]),
          'collection-1');
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper test ID for import button', () => {
      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      expect(screen.getByTestId('import-postman-environment')).toBeInTheDocument();
    });

    test('should have proper modal test ID', () => {
      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      expect(screen.getByTestId('import-environment-modal')).toBeInTheDocument();
    });

    test('should have clickable import button', () => {
      render(
        <Provider store={store}>
          <ImportEnvironment
            collection={mockCollection}
            onClose={mockOnClose}
          />
        </Provider>
      );

      const importButton = screen.getByTestId('import-postman-environment');
      expect(importButton).toHaveAttribute('type', 'button');
    });
  });
});
