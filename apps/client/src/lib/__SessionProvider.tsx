import { ScixUser } from '@server/types';
import to from 'await-to-js';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { __, all, allPass, complement, includes, is, isEmpty, propSatisfies } from 'ramda';
import { createContext, FC, ReactNode, Reducer, useCallback, useContext, useEffect, useReducer, useRef } from 'react';

import { logger } from '@/logger';

// Interface for session state and methods
export interface ScixSession {
  user: ScixUser | null;
  loading: boolean;
  error: string | null;
  apiRequest: <T = unknown, E = unknown>(config: AxiosRequestConfig) => Promise<AxiosResponse<T> | AxiosError<E>>;
  refreshSession: () => Promise<void>;
  fetchSession: () => Promise<void>;
  logout: () => Promise<void>;
}

// Type guard to check if a given object is a valid ScixUser
const isScixUser = (userData: unknown): userData is ScixUser => {
  return allPass([
    is(Object), // Ensure userData is an object
    propSatisfies(is(String), 'expire'), // Check if 'expire' is a string
    propSatisfies(complement(isEmpty), 'expire'), // Ensure 'expire' is not an empty string
    propSatisfies(is(String), 'token'), // Check if 'token' is a string
    propSatisfies(complement(isEmpty), 'token'), // Ensure 'token' is not an empty string
    propSatisfies(is(String), 'name'), // Check if 'name' is a string
    propSatisfies(is(Array), 'permissions'), // Ensure 'permissions' is an array
    propSatisfies(all(is(String)), 'permissions'), // Ensure all elements in 'permissions' are strings
    propSatisfies(includes(__, ['anonymous', 'user']), 'role'), // Ensure 'role' is either 'anonymous' or 'user'
  ])(userData);
};

// Function to check if the user session is valid and not expired
const checkScixUser = (user?: unknown): boolean => {
  if (isScixUser(user)) {
    const expiresAtTimestamp = parseInt(user.expire, 10) * 1000;
    // Check if the session is valid for at least another minute
    return expiresAtTimestamp - Date.now() >= 60 * 1000;
  }
  return false;
};

// Create a context for the session state
const SessionContext = createContext<ScixSession | null>(null);

// Custom hook to use the session context
export const useSession = () => {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return session;
};

// Function to create a new Axios instance
const createAxiosInstance = () => {
  return axios.create({});
};

// Define action types for the session reducer
type SessionAction =
  | { type: 'SET_USER'; payload: ScixSession['user'] }
  | { type: 'SET_LOADING'; payload: ScixSession['loading'] }
  | { type: 'SET_ERROR'; payload: ScixSession['error'] };

// Reducer function to manage session state
const sessionReducer: Reducer<Pick<ScixSession, 'user' | 'error' | 'loading'>, SessionAction> = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, error: null, loading: false, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// SessionProvider component to manage session state and API requests
const __SessionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Create and store the Axios instance using a ref
  const api = useRef<AxiosInstance>(createAxiosInstance());
  // Use a reducer to manage session state
  const [state, dispatch] = useReducer(sessionReducer, { user: null, loading: true, error: null });

  // Effect to set the Authorization header when a user is available
  useEffect(() => {
    if (isScixUser(state.user)) {
      api.current.defaults.headers['Authorization'] = `Bearer ${state.user.token}`;
      logger.debug({ token: state.user.token }, 'API token set');
    }
  }, [state.user]);

  // Function to fetch the current session
  const fetchSession = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const [err, res] = await to<AxiosResponse<ScixUser>>(
      api.current.get('/api/auth/session', { withCredentials: true }),
    );

    if (err) {
      logger.error(err, 'Failed to fetch session');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch session.' });
    } else if (isScixUser(res?.data)) {
      logger.debug(res.data, 'Session fetched successfully');
      dispatch({ type: 'SET_USER', payload: res?.data });
    }

    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  // Function to refresh the session token
  const refreshSession = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const [err, res] = await to(api.current.get('/api/auth/refresh', { withCredentials: true }));
    if (err) {
      logger.error(err, 'Failed to refresh session');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh session.' });
    }
    if (isScixUser(res?.data)) {
      logger.debug(res.data, 'Session refreshed successfully');
      dispatch({ type: 'SET_USER', payload: res?.data });
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  // Function to log out the user
  const logout = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const [err] = await to(api.current.post('/api/auth/logout', {}, { withCredentials: true }));
    if (err) {
      logger.error(err, 'Failed to log out');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to log out.' });
    } else {
      logger.debug('Logged out successfully');
      dispatch({ type: 'SET_USER', payload: null });
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  // Function to make API requests with automatic token refresh on 401 errors
  const apiRequest = useCallback(
    async <T,>(config: AxiosRequestConfig, retry = false): Promise<AxiosResponse<T>> => {
      // First, check if the user is valid
      if (checkScixUser(state.user)) {
        const [err, response] = await to<AxiosResponse<T>>(api.current.request<T>(config));

        if (err && axios.isAxiosError(err)) {
          // Handle 401 Unauthorized - refresh the session if retry is false
          if (err.response?.status === 401 && !retry) {
            logger.warn('Token expired, refreshing session');
            await refreshSession();
            return apiRequest(config, true); // Retry the request after refreshing the token
          }

          // If the error is not related to token expiration or we already retried, throw the error
          logger.error(err, 'API request failed');
          throw err;
        }

        if (!response) {
          throw new Error('Response is empty');
        }

        // Return the successful response
        return response;
      } else {
        // If the user token is invalid or missing, refresh the session and retry
        logger.debug('Token is missing or expired, refreshing session');
        await refreshSession();
        return apiRequest(config, true); // Retry the request after refreshing the token
      }
    },
    [state.user, refreshSession],
  );

  return (
    <SessionContext.Provider
      value={{
        ...state,
        fetchSession,
        refreshSession,
        logout,
        apiRequest,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export default __SessionProvider;
