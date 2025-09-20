import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useGetProfileQuery } from "../../redux/api/authApi";
import {
  setCredentials,
  clearCredentials,
  setLoading,
} from "../../redux/slices/authSlice";

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();

  // Try to get user profile on app initialization
  // This will work if httpOnly cookies are present and valid
  const {
    data: profileData,
    error: profileError,
    isLoading: profileLoading,
    isError: profileIsError,
  } = useGetProfileQuery(undefined, {
    // Skip if we know there's no auth data
    skip: false,
  });

  useEffect(() => {
    dispatch(setLoading(profileLoading));
  }, [profileLoading, dispatch]);

  useEffect(() => {
    if (profileData?.success) {
      // User is authenticated, set credentials
      dispatch(
        setCredentials({
          user: profileData.data,
          accessToken: "authenticated", // We don't need the actual token since it's in httpOnly cookies
        })
      );
    } else if (profileIsError && profileError?.status === 401) {
      // User is not authenticated, clear credentials
      dispatch(clearCredentials());
    }
  }, [profileData, profileError, profileIsError, dispatch]);

  return children;
};

export default AuthProvider;
