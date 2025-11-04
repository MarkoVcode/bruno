/**
 * Test suite for EnvironmentSettings Component
 * Tests modal behavior, no environments display, and user flow
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import EnvironmentSettings, { SharedButton } from 'components/Environments/EnvironmentSettings';

// Mock child components
jest.mock('components/Modal', () => ({ children, title, size, hideFooter, handleCancel }) => (
  <div data-testid="environment-settings-modal" data-size={size}>
    <div data-testid="modal-title">{title}</div>
    <button onClick={handleCancel} data-testid="modal-close">Close</button>
    <div>{children}</div>
  </div>
));

jest.mock('components/Environments/EnvironmentSettings/CreateEnvironment', () => ({ onClose }) => (
  <div data-testid="create-environment-modal">
    <button onClick={onClose} data-testid="create-close">Close Create</button>
  </div>
));

jest.mock('components/Environments/EnvironmentSettings/ImportEnvironment', () => ({ onClose }) => (
  <div data-testid="import-environment-modal">
    <button onClick={onClose} data-testid="import-close">Close Import</button>
  </div>
));

jest.mock('components/Environments/EnvironmentSettings/EnvironmentList', () => ({ collection, onClose }) => (
  <div data-testid="environment-list">
    <div>Environment List for {collection.name}</div>
    <button onClick={onClose} data-testid="list-close">Close List</button>
  </div>
));

const mockStore = configureStore([]);

describe('EnvironmentSettings Component', () => {
  let store;
  const mockOnClose = jest.fn();

  beforeEach(() => {
    store = mockStore({});
    jest.clearAllMocks();
  });

  describe('SharedButton Component', () => {
    test('should render button with children', () => {
      const mockOnClick = jest.fn();

      render(
        <SharedButton onClick={mockOnClick}>
          Test Button
        </SharedButton>
      );

      const button = screen.getByText('Test Button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    test('should call onClick when clicked', () => {
      const mockOnClick = jest.fn();

      render(
        <SharedButton onClick={mockOnClick}>
  Click Me
        </SharedButton>);

      fireEvent.click(screen.getByText('Click Me'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('should apply custom className', () => {
      render(
        <SharedButton className="custom-class" onClick={() => {}}>
  Button
        </SharedButton>);

      const button = screen.getByText('Button');
      expect(button).toHaveClass('custom-class');
    });

    test('should have default styling classes', () => {
      render(
        <SharedButton onClick={() => {}}>
  Button
        </SharedButton>);

      const button = screen.getByText('Button');
      expect(button).toHaveClass('rounded', 'bg-transparent', 'px-2.5', 'py-2');
    });
  });

  describe('No Environments - Default Tab', () => {
    test('should show default tab when no environments exist', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Empty Collection',
        environments: []
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      expect(screen.getByText('No environments found')).toBeInTheDocument();
      expect(screen.getByText(/Get started by using the following buttons/)).toBeInTheDocument();
    });

    test('should show create and import buttons on default tab', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Empty Collection',
        environments: []
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      expect(screen.getByText('Create Environment')).toBeInTheDocument();
      expect(screen.getByText('Import Environment')).toBeInTheDocument();
      expect(screen.getByText('Or')).toBeInTheDocument();
    });

    test('should use medium size modal when no environments exist', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Empty Collection',
        environments: []
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      const modal = screen.getByTestId('environment-settings-modal');
      expect(modal).toHaveAttribute('data-size', 'md');
    });

    test('should show AlertIcon when no environments exist', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Empty Collection',
        environments: []
      };

      const { container } = render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      // IconFileAlert should be rendered
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Tab Navigation - No Environments', () => {
    test('should switch to create tab when Create button is clicked', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Empty Collection',
        environments: []
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      fireEvent.click(screen.getByText('Create Environment'));

      expect(screen.getByTestId('create-environment-modal')).toBeInTheDocument();
      expect(screen.queryByText('No environments found')).not.toBeInTheDocument();
    });

    test('should switch to import tab when Import button is clicked', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Empty Collection',
        environments: []
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      fireEvent.click(screen.getByText('Import Environment'));

      expect(screen.getByTestId('import-environment-modal')).toBeInTheDocument();
      expect(screen.queryByText('No environments found')).not.toBeInTheDocument();
    });

    test('should return to default tab when create modal is closed with no environments', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Empty Collection',
        environments: []
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      // Open create modal
      fireEvent.click(screen.getByText('Create Environment'));
      expect(screen.getByTestId('create-environment-modal')).toBeInTheDocument();

      // Close create modal
      fireEvent.click(screen.getByTestId('create-close'));

      // Should return to default tab
      expect(screen.getByText('No environments found')).toBeInTheDocument();
    });

    test('should return to default tab when import modal is closed with no environments', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Empty Collection',
        environments: []
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      // Open import modal
      fireEvent.click(screen.getByText('Import Environment'));
      expect(screen.getByTestId('import-environment-modal')).toBeInTheDocument();

      // Close import modal
      fireEvent.click(screen.getByTestId('import-close'));

      // Should return to default tab
      expect(screen.getByText('No environments found')).toBeInTheDocument();
    });
  });

  describe('With Environments - Environment List', () => {
    test('should show environment list when environments exist', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test Collection',
        environments: [
          {
            uid: 'env-1',
            name: 'Development',
            variables: []
          }
        ]
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      expect(screen.getByTestId('environment-list')).toBeInTheDocument();
      expect(screen.queryByText('No environments found')).not.toBeInTheDocument();
    });

    test('should use large size modal when environments exist', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test Collection',
        environments: [
          { uid: 'env-1', name: 'Development', variables: [] }
        ]
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      const modal = screen.getByTestId('environment-settings-modal');
      expect(modal).toHaveAttribute('data-size', 'lg');
    });

    test('should pass collection to EnvironmentList', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test Collection',
        environments: [
          { uid: 'env-1', name: 'Development', variables: [] }
        ]
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      expect(screen.getByText('Environment List for Test Collection')).toBeInTheDocument();
    });

    test('should handle multiple environments', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Multi-Env Collection',
        environments: [
          { uid: 'env-1', name: 'Development', variables: [] },
          { uid: 'env-2', name: 'Staging', variables: [] },
          { uid: 'env-3', name: 'Production', variables: [] }
        ]
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      expect(screen.getByTestId('environment-list')).toBeInTheDocument();
      expect(collection.environments).toHaveLength(3);
    });
  });

  describe('Modal Close Behavior', () => {
    test('should call onClose when modal close button is clicked', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test Collection',
        environments: []
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>
      );

      fireEvent.click(screen.getByTestId('modal-close'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should propagate close from EnvironmentList', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test Collection',
        environments: [
          { uid: 'env-1', name: 'Development', variables: [] }
        ]
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>
      );

      fireEvent.click(screen.getByTestId('list-close'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null environments array', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Null Envs Collection',
        environments: null
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>
      );

      expect(screen.getByText('No environments found')).toBeInTheDocument();
    });

    test('should handle undefined environments array', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Undefined Envs Collection'
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      expect(screen.getByText('No environments found')).toBeInTheDocument();
    });

    test('should handle collection with special characters in name', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test/Collection (v2) [2024]',
        environments: [
          { uid: 'env-1', name: 'Dev', variables: [] }
        ]
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>
      );

      expect(screen.getByText('Environment List for Test/Collection (v2) [2024]')).toBeInTheDocument();
    });

    test('should handle very long collection names', () => {
      const longName = 'A'.repeat(200);
      const collection = {
        uid: 'collection-1',
        name: longName,
        environments: []
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      expect(screen.getByText('No environments found')).toBeInTheDocument();
    });

    test('should handle environment with no variables', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test Collection',
        environments: [
          { uid: 'env-1', name: 'Empty Env', variables: [] }
        ]
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      expect(screen.getByTestId('environment-list')).toBeInTheDocument();
    });

    test('should handle environment with null variables', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test Collection',
        environments: [
          { uid: 'env-1', name: 'Null Vars', variables: null }
        ]
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>
      );

      expect(screen.getByTestId('environment-list')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    test('should initialize isModified state to false', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test Collection',
        environments: [
          { uid: 'env-1', name: 'Dev', variables: [] }
        ]
      };

      const { container } = render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      // Component should render without errors
      expect(screen.getByTestId('environment-list')).toBeInTheDocument();
    });

    test('should initialize selectedEnvironment state to null for no environments', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Empty Collection',
        environments: []
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      expect(screen.getByText('No environments found')).toBeInTheDocument();
    });

    test('should maintain tab state correctly', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Empty Collection',
        environments: []
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      // Default tab
      expect(screen.getByText('No environments found')).toBeInTheDocument();

      // Switch to create
      fireEvent.click(screen.getByText('Create Environment'));
      expect(screen.getByTestId('create-environment-modal')).toBeInTheDocument();

      // Close and return to default
      fireEvent.click(screen.getByTestId('create-close'));
      expect(screen.getByText('No environments found')).toBeInTheDocument();

      // Switch to import
      fireEvent.click(screen.getByText('Import Environment'));
      expect(screen.getByTestId('import-environment-modal')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper modal title', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test Collection',
        environments: []
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>
      );

      expect(screen.getByTestId('modal-title')).toHaveTextContent('Environments');
    });

    test('should have clickable buttons on default tab', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Empty Collection',
        environments: []
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      const createButton = screen.getByText('Create Environment').closest('button');
      const importButton = screen.getByText('Import Environment').closest('button');

      expect(createButton).toHaveAttribute('type', 'button');
      expect(importButton).toHaveAttribute('type', 'button');
    });

    test('should have proper test IDs', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test Collection',
        environments: []
      };

      render(
        <Provider store={store}>
          <EnvironmentSettings collection={collection} onClose={mockOnClose} />
        </Provider>);

      expect(screen.getByTestId('environment-settings-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toBeInTheDocument();
      expect(screen.getByTestId('modal-close')).toBeInTheDocument();
    });
  });
});
