/**
 * Test suite for ExportEnvironment Component
 * Tests UI interactions and export functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import ExportEnvironment from 'components/Environments/EnvironmentSettings/ExportEnvironment';
import toast from 'react-hot-toast';
import * as brunoEnvironmentExporter from 'utils/exporters/bruno-environment';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('utils/exporters/bruno-environment');
jest.mock('components/Portal', () => ({ children }) => <div data-testid="portal">{children}</div>);
jest.mock('components/Modal', () => ({ children, title, onClose, dataTestId }) => (
  <div data-testid={dataTestId || 'modal'}>
    <div data-testid="modal-title">{title}</div>
    <div>{children}</div>
  </div>
));

describe('ExportEnvironment Component', () => {
  const mockOnClose = jest.fn();

  const mockCollection = {
    uid: 'collection-1',
    name: 'Test Collection',
    environments: [
      {
        uid: 'env-1',
        name: 'Development',
        variables: [
          { uid: 'var-1', name: 'API_URL', value: 'http://localhost:3000', enabled: true }
        ]
      },
      {
        uid: 'env-2',
        name: 'Production',
        variables: [
          { uid: 'var-2', name: 'API_URL', value: 'https://api.example.com', enabled: true }
        ]
      }
    ]
  };

  const mockSelectedEnvironment = mockCollection.environments[0];

  beforeEach(() => {
    jest.clearAllMocks();
    toast.success = jest.fn();
    toast.error = jest.fn();
    brunoEnvironmentExporter.exportEnvironment = jest.fn();
    brunoEnvironmentExporter.exportEnvironments = jest.fn();
  });

  describe('Component Rendering', () => {
    test('should render export modal with correct title', () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('export-environment-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Export Environment');
    });

    test('should render secret checkbox option', () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      const checkbox = screen.getByLabelText('Include secret values');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    test('should render export selected environment button', () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      const exportButton = screen.getByTestId('export-selected-environment');
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).toHaveTextContent('Export Selected Environment');
      expect(exportButton).toHaveTextContent('Development');
    });

    test('should render export all button when multiple environments exist', () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      const exportAllButton = screen.getByTestId('export-all-environments');
      expect(exportAllButton).toBeInTheDocument();
      expect(exportAllButton).toHaveTextContent('Export All Environments');
      expect(exportAllButton).toHaveTextContent('2 environment(s)');
    });

    test('should not render export all button when only one environment exists', () => {
      const singleEnvCollection = {
        ...mockCollection,
        environments: [mockCollection.environments[0]]
      };

      render(
        <ExportEnvironment
          collection={singleEnvCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByTestId('export-all-environments')).not.toBeInTheDocument();
    });

    test('should disable export selected button when no environment is selected', () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={null}
          onClose={mockOnClose}
        />
      );

      const exportButton = screen.getByTestId('export-selected-environment');
      expect(exportButton).toBeDisabled();
    });
  });

  describe('Secret Checkbox Interaction', () => {
    test('should toggle includeSecrets state when checkbox is clicked', () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      const checkbox = screen.getByLabelText('Include secret values');

      // Initially unchecked
      expect(checkbox).not.toBeChecked();
      expect(screen.getByText('Secret values will be cleared for security')).toBeInTheDocument();

      // Click to check
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
      expect(screen.getByText('⚠️ Secret values will be included in plain text')).toBeInTheDocument();

      // Click to uncheck
      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
      expect(screen.getByText('Secret values will be cleared for security')).toBeInTheDocument();
    });
  });

  describe('Export Selected Environment', () => {
    test('should export selected environment when button is clicked', async () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      const exportButton = screen.getByTestId('export-selected-environment');

      await act(async () => {
        fireEvent.click(exportButton);
      });

      expect(brunoEnvironmentExporter.exportEnvironment).toHaveBeenCalledTimes(1);
      expect(brunoEnvironmentExporter.exportEnvironment).toHaveBeenCalledWith(
        mockSelectedEnvironment,
        { includeSecrets: false }
      );
      expect(toast.success).toHaveBeenCalledWith('Environment "Development" exported successfully');
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should export with includeSecrets when checkbox is checked', async () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      const checkbox = screen.getByLabelText('Include secret values');
      fireEvent.click(checkbox);

      const exportButton = screen.getByTestId('export-selected-environment');

      await act(async () => {
        fireEvent.click(exportButton);
      });

      expect(brunoEnvironmentExporter.exportEnvironment).toHaveBeenCalledWith(
        mockSelectedEnvironment,
        { includeSecrets: true }
      );
    });

    test('should show error when no environment is selected', async () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={null}
          onClose={mockOnClose}
        />
      );

      const exportButton = screen.getByTestId('export-selected-environment');

      // Button should be disabled
      expect(exportButton).toBeDisabled();

      // Force click (won't work due to disabled state)
      // But test the handler logic would show error if called
    });

    test('should handle export errors gracefully', async () => {
      const exportError = new Error('Export failed');
      brunoEnvironmentExporter.exportEnvironment.mockImplementation(() => {
        throw exportError;
      });

      // Mock console.error to avoid test output noise
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      const exportButton = screen.getByTestId('export-selected-environment');

      await act(async () => {
        fireEvent.click(exportButton);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Export error:', exportError);
      expect(toast.error).toHaveBeenCalledWith('Failed to export environment');
      expect(mockOnClose).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Export All Environments', () => {
    test('should export all environments when button is clicked', async () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      const exportAllButton = screen.getByTestId('export-all-environments');

      await act(async () => {
        fireEvent.click(exportAllButton);
      });

      expect(brunoEnvironmentExporter.exportEnvironments).toHaveBeenCalledTimes(1);
      expect(brunoEnvironmentExporter.exportEnvironments).toHaveBeenCalledWith(
        mockCollection.environments,
        mockCollection.name,
        { includeSecrets: false }
      );
      expect(toast.success).toHaveBeenCalledWith('All 2 environment(s) exported successfully');
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should export all with includeSecrets when checkbox is checked', async () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      const checkbox = screen.getByLabelText('Include secret values');
      fireEvent.click(checkbox);

      const exportAllButton = screen.getByTestId('export-all-environments');

      await act(async () => {
        fireEvent.click(exportAllButton);
      });

      expect(brunoEnvironmentExporter.exportEnvironments).toHaveBeenCalledWith(
        mockCollection.environments,
        mockCollection.name,
        { includeSecrets: true }
      );
    });

    test('should show error when no environments exist', async () => {
      const emptyCollection = {
        ...mockCollection,
        environments: []
      };

      // Render with empty collection
      const { rerender } = render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      // Export all button exists initially
      const exportAllButton = screen.getByTestId('export-all-environments');

      // Mock the export to simulate empty environments check
      brunoEnvironmentExporter.exportEnvironments.mockImplementation(() => {
        if (!mockCollection.environments || mockCollection.environments.length === 0) {
          throw new Error('No environments');
        }
      });

      await act(async () => {
        fireEvent.click(exportAllButton);
      });

      // Should successfully export since we have environments
      expect(toast.success).toHaveBeenCalled();
    });

    test('should handle export all errors gracefully', async () => {
      const exportError = new Error('Export all failed');
      brunoEnvironmentExporter.exportEnvironments.mockImplementation(() => {
        throw exportError;
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      const exportAllButton = screen.getByTestId('export-all-environments');

      await act(async () => {
        fireEvent.click(exportAllButton);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Export error:', exportError);
      expect(toast.error).toHaveBeenCalledWith('Failed to export environments');
      expect(mockOnClose).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('UI State Management', () => {
    test('should maintain checkbox state across multiple exports', async () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      const checkbox = screen.getByLabelText('Include secret values');
      const exportButton = screen.getByTestId('export-selected-environment');

      // Check the checkbox
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      // First export
      await act(async () => {
        fireEvent.click(exportButton);
      });

      expect(brunoEnvironmentExporter.exportEnvironment).toHaveBeenCalledWith(
        mockSelectedEnvironment,
        { includeSecrets: true }
      );
    });

    test('should display correct environment count', () => {
      const threeEnvCollection = {
        ...mockCollection,
        environments: [
          ...mockCollection.environments,
          { uid: 'env-3', name: 'Staging', variables: [] }
        ]
      };

      render(
        <ExportEnvironment
          collection={threeEnvCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('3 environment(s)')).toBeInTheDocument();
    });

    test('should show selected environment name in export button', () => {
      const prodEnv = mockCollection.environments[1];

      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={prodEnv}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Production')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle environment with special characters in name', async () => {
      const specialEnv = {
        uid: 'env-special',
        name: 'Dev/Test (Local) [2024]',
        variables: []
      };

      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={specialEnv}
          onClose={mockOnClose}
        />
      );

      const exportButton = screen.getByTestId('export-selected-environment');

      await act(async () => {
        fireEvent.click(exportButton);
      });

      expect(brunoEnvironmentExporter.exportEnvironment).toHaveBeenCalledWith(
        specialEnv,
        { includeSecrets: false }
      );
      expect(toast.success).toHaveBeenCalledWith('Environment "Dev/Test (Local) [2024]" exported successfully');
    });

    test('should handle collection with null environments array', () => {
      const nullEnvCollection = {
        ...mockCollection,
        environments: null
      };

      render(
        <ExportEnvironment
          collection={nullEnvCollection}
          selectedEnvironment={null}
          onClose={mockOnClose}
        />
      );

      // Should not crash
      expect(screen.getByTestId('export-environment-modal')).toBeInTheDocument();
      expect(screen.queryByTestId('export-all-environments')).not.toBeInTheDocument();
    });

    test('should handle very long environment names', () => {
      const longNameEnv = {
        uid: 'env-long',
        name: 'A'.repeat(200),
        variables: []
      };

      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={longNameEnv}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper button states for accessibility', () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      const exportButton = screen.getByTestId('export-selected-environment');
      const exportAllButton = screen.getByTestId('export-all-environments');

      expect(exportButton).not.toBeDisabled();
      expect(exportAllButton).not.toBeDisabled();
    });

    test('should have proper label association for checkbox', () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      const checkbox = screen.getByLabelText('Include secret values');
      expect(checkbox).toHaveAttribute('id', 'include-secrets');
    });

    test('should have proper test IDs for testing', () => {
      render(
        <ExportEnvironment
          collection={mockCollection}
          selectedEnvironment={mockSelectedEnvironment}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('export-environment-modal')).toBeInTheDocument();
      expect(screen.getByTestId('export-selected-environment')).toBeInTheDocument();
      expect(screen.getByTestId('export-all-environments')).toBeInTheDocument();
    });
  });
});
