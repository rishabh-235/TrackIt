import { createSlice } from "@reduxjs/toolkit";

// Initial auth state - we'll restore this via API call since cookies are httpOnly
const getInitialAuthState = () => {
  return {
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start with loading true to check auth status
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialAuthState(),
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.accessToken;
      state.user = action.payload.user;
    },
    loginFailure: (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      clearAuthCookies();
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.isLoading = false;
      // Don't clear cookies here since they're httpOnly - backend will handle this
    },
    updateToken: (state, action) => {
      state.token = action.payload;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    // New action for setting credentials from API response
    setCredentials: (state, action) => {
      const { accessToken, user } = action.payload;
      state.token = accessToken;
      state.user = user;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    clearCredentials: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.isLoading = false;
      // Don't clear cookies here since they're httpOnly - backend will handle this
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateToken,
  updateUser,
  setLoading,
  setCredentials,
  clearCredentials,
} = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectUserRole = (state) => state.auth.user?.role;

export default authSlice.reducer;
