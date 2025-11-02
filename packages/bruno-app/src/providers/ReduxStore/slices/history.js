import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  history: [],
  isHistoryOpen: false,
  visibleDays: 5,
  isLoading: false,
  filters: {
    method: 'ALL',
    collection: 'ALL',
    status: 'ALL'
  },
  selectedEntry: null
};

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    openHistory: (state) => {
      state.isHistoryOpen = true;
    },
    closeHistory: (state) => {
      state.isHistoryOpen = false;
    },
    toggleHistory: (state) => {
      state.isHistoryOpen = !state.isHistoryOpen;
    },
    loadHistory: (state, action) => {
      state.history = action.payload;
      state.isLoading = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    addHistoryEntry: (state, action) => {
      // Add new entry at the beginning (most recent first)
      state.history.unshift(action.payload);

      // Keep only last 1000 entries in memory
      if (state.history.length > 1000) {
        state.history = state.history.slice(0, 1000);
      }
    },
    clearHistory: (state) => {
      state.history = [];
    },
    setVisibleDays: (state, action) => {
      state.visibleDays = action.payload;
    },
    loadMoreDays: (state) => {
      state.visibleDays += 5;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        method: 'ALL',
        collection: 'ALL',
        status: 'ALL'
      };
    },
    setSelectedEntry: (state, action) => {
      state.selectedEntry = action.payload;
    },
    clearSelectedEntry: (state) => {
      state.selectedEntry = null;
    }
  }
});

export const {
  openHistory,
  closeHistory,
  toggleHistory,
  loadHistory,
  setLoading,
  addHistoryEntry,
  clearHistory,
  setVisibleDays,
  loadMoreDays,
  updateFilters,
  resetFilters,
  setSelectedEntry,
  clearSelectedEntry
} = historySlice.actions;

export default historySlice.reducer;
