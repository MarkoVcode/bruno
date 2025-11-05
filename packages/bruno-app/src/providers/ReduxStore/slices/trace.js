/**
 * Trace Redux Slice
 *
 * Manages trace data state for the trace plugin system.
 * Stores trace responses, history, and active trace configuration.
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Current trace data being displayed in DevTools
  currentTrace: null,

  // Traces mapped by item UID (for ResponsePane display)
  tracesByItem: {},

  // History of trace responses (limited to prevent memory issues)
  history: [],

  // Maximum number of trace entries to keep in history
  maxHistory: 50,

  // Pending trace requests (waiting for response)
  pending: {},

  // Trace errors
  errors: []
};

export const traceSlice = createSlice({
  name: 'trace',
  initialState,
  reducers: {
    /**
     * Set the current trace data to display
     */
    setCurrentTrace: (state, action) => {
      state.currentTrace = action.payload;

      // Add to history if not null
      if (action.payload) {
        const traceEntry = {
          ...action.payload,
          historyId: Date.now() + Math.random(),
          capturedAt: new Date().toISOString()
        };

        state.history.push(traceEntry);

        // Limit history size
        if (state.history.length > state.maxHistory) {
          state.history = state.history.slice(-state.maxHistory);
        }

        // Store trace by item UID for ResponsePane display
        // Extract item UID from request ID (format: trace-{itemUid}-{timestamp}-{random})
        const requestId = action.payload.metadata?.requestId;
        if (requestId) {
          const match = requestId.match(/^trace-([^-]+)-/);
          if (match) {
            const itemUid = match[1];
            state.tracesByItem[itemUid] = action.payload;
          }
        }
      }
    },

    /**
     * Clear the current trace data
     */
    clearCurrentTrace: (state) => {
      state.currentTrace = null;
    },

    /**
     * Clear all trace history
     */
    clearHistory: (state) => {
      state.history = [];
    },

    /**
     * Add a pending trace request
     */
    addPendingTrace: (state, action) => {
      const { requestId, metadata } = action.payload;
      state.pending[requestId] = {
        requestId,
        metadata,
        startTime: Date.now(),
        status: 'pending'
      };
    },

    /**
     * Remove a pending trace request
     */
    removePendingTrace: (state, action) => {
      const requestId = action.payload;
      delete state.pending[requestId];
    },

    /**
     * Update pending trace status
     */
    updatePendingTrace: (state, action) => {
      const { requestId, status, error } = action.payload;
      if (state.pending[requestId]) {
        state.pending[requestId].status = status;
        if (error) {
          state.pending[requestId].error = error;
        }
      }
    },

    /**
     * Add a trace error
     */
    addTraceError: (state, action) => {
      const { requestId, error, timestamp } = action.payload;
      const errorEntry = {
        id: Date.now() + Math.random(),
        requestId,
        error,
        timestamp: timestamp || new Date().toISOString()
      };

      state.errors.push(errorEntry);

      // Limit errors
      if (state.errors.length > 100) {
        state.errors = state.errors.slice(-100);
      }
    },

    /**
     * Clear all trace errors
     */
    clearTraceErrors: (state) => {
      state.errors = [];
    },

    /**
     * Load a trace from history by ID
     */
    loadTraceFromHistory: (state, action) => {
      const historyId = action.payload;
      const traceEntry = state.history.find((t) => t.historyId === historyId);
      if (traceEntry) {
        state.currentTrace = traceEntry;
      }
    }
  }
});

// Export actions
export const {
  setCurrentTrace,
  clearCurrentTrace,
  clearHistory,
  addPendingTrace,
  removePendingTrace,
  updatePendingTrace,
  addTraceError,
  clearTraceErrors,
  loadTraceFromHistory
} = traceSlice.actions;

// Export reducer
export default traceSlice.reducer;
