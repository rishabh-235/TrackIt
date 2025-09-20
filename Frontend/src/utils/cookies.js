import Cookies from "js-cookie";

// Cookie names
export const COOKIE_NAMES = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
};

// Get access token from cookie
export const getAccessToken = () => {
  return Cookies.get(COOKIE_NAMES.ACCESS_TOKEN);
};

// Get refresh token from cookie
export const getRefreshToken = () => {
  return Cookies.get(COOKIE_NAMES.REFRESH_TOKEN);
};

// Set access token cookie
export const setAccessToken = (token) => {
  Cookies.set(COOKIE_NAMES.ACCESS_TOKEN, token, {
    expires: 1 / 96, // 15 minutes (1/96 of a day)
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

// Set refresh token cookie
export const setRefreshToken = (token) => {
  Cookies.set(COOKIE_NAMES.REFRESH_TOKEN, token, {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

// Clear all auth cookies
export const clearAuthCookies = () => {
  Cookies.remove(COOKIE_NAMES.ACCESS_TOKEN);
  Cookies.remove(COOKIE_NAMES.REFRESH_TOKEN);
};

// Check if user is authenticated (has access token)
export const isAuthenticated = () => {
  return !!getAccessToken();
};

// Get user data from access token (decode JWT)
export const getUserFromToken = (token) => {
  if (!token) return null;

  try {
    // Decode JWT payload (this is just for getting user info, not for security)
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = getUserFromToken(token);
    if (!payload || !payload.exp) return true;

    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};
