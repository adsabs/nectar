/**
 * Provides access to the user session and methods to logout
 */
export const useSession = () => {
  return {
    logout: () => {},
    isAuthenticated: false,
  };
};
