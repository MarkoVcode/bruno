import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  displayValue: null,
  isLoading: false,
  lastUpdated: null
};

export const hookTopBarSlice = createSlice({
  name: 'hookTopBar',
  initialState,
  reducers: {
    setHookTopBarValue: (state, action) => {
      state.displayValue = action.payload;
      state.isLoading = false;
      state.lastUpdated = Date.now();
    },
    setHookTopBarLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    clearHookTopBarValue: (state) => {
      state.displayValue = null;
      state.isLoading = false;
      state.lastUpdated = null;
    }
  }
});

export const { setHookTopBarValue, setHookTopBarLoading, clearHookTopBarValue } = hookTopBarSlice.actions;

export default hookTopBarSlice.reducer;
