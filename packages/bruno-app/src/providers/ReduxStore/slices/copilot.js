const { createSlice } = require('@reduxjs/toolkit');

const initialState = {
  authenticated: false,
  authStatus: 'idle', // 'idle' | 'authenticating' | 'authenticated' | 'error'
  verificationUri: null,
  userCode: null,
  hasCopilotAccess: false,
  error: null,
  metadata: null,
  currentTask: null,
  processing: false
};

const copilotSlice = createSlice({
  name: 'copilot',
  initialState,
  reducers: {
    // Authentication actions
    startAuthentication: (state) => {
      state.authStatus = 'authenticating';
      state.error = null;
    },
    setVerificationInfo: (state, action) => {
      state.verificationUri = action.payload.verificationUri;
      state.userCode = action.payload.userCode;
    },
    authenticationSuccess: (state, action) => {
      state.authenticated = true;
      state.authStatus = 'authenticated';
      state.hasCopilotAccess = action.payload.hasCopilotAccess;
      state.metadata = action.payload.metadata || null;
      state.error = null;
      state.verificationUri = null;
      state.userCode = null;
    },
    authenticationFailure: (state, action) => {
      state.authenticated = false;
      state.authStatus = 'error';
      state.error = action.payload.error;
      state.verificationUri = null;
      state.userCode = null;
    },
    setAuthStatus: (state, action) => {
      state.authenticated = action.payload.authenticated;
      state.hasCopilotAccess = action.payload.hasCopilotAccess || false;
      state.metadata = action.payload.metadata || null;
      state.authStatus = action.payload.authenticated ? 'authenticated' : 'idle';
    },
    logout: (state) => {
      state.authenticated = false;
      state.authStatus = 'idle';
      state.hasCopilotAccess = false;
      state.metadata = null;
      state.error = null;
      state.verificationUri = null;
      state.userCode = null;
    },

    // Task processing actions
    startTask: (state, action) => {
      state.currentTask = action.payload.task;
      state.processing = true;
      state.error = null;
    },
    taskSuccess: (state, action) => {
      state.processing = false;
      state.currentTask = null;
      state.error = null;
    },
    taskFailure: (state, action) => {
      state.processing = false;
      state.error = action.payload.error;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const copilotActions = copilotSlice.actions;
export default copilotSlice.reducer;
